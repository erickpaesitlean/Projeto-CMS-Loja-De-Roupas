import { Component, OnInit, OnDestroy, signal, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  FormControl,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidatorFn
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../../services/product.service';
import { CategoryService } from '../../../services/category.service';
import { UploadService, UploadResponse } from '../../../services/upload.service';
import { Product, ProductFormData, ProductStatus } from '../../../models/product.model';
import { Category } from '../../../models/category.model';
import { Store } from '../../../models/store.model';
import { IconComponent } from '../../../shared/icons/icon.component';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subject, Subscription, forkJoin, merge, of } from 'rxjs';
import { switchMap, catchError, startWith, takeUntil, map } from 'rxjs/operators';

// Função helper para garantir URL absoluta do backend
function getImageUrl(url: string): string {
  // Se já é uma URL completa (http/https), retorna como está
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // Se é uma URL relativa (começa com /), adiciona a URL base do backend
  if (url.startsWith('/')) {
    return `http://localhost:3000${url}`;
  }
  // Se não começa com /, assume que é um nome de arquivo e adiciona o caminho completo
  return `http://localhost:3000/uploads/produtos/${url}`;
}

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.scss'
})
export class ProductFormComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly uploadService = inject(UploadService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();
  private activationValidationSub?: Subscription;

  productForm!: FormGroup;
  isEditMode = signal(false);
  productId = signal<number | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  categories = signal<Category[]>([]);
  lojas = signal<Store[]>([]);

  // Tamanhos padrão
  tamanhosPadrao = ['PP', 'P', 'M', 'G', 'GG', 'XG'];
  tamanhosCustomizados = signal<string[]>([]);

  // Imagens
  imagensUrls = signal<string[]>([]); // URLs das imagens já salvas no servidor
  selectedFiles = signal<File[]>([]); // Arquivos selecionados para upload
  previewUrls = signal<string[]>([]); // URLs de preview local (URL.createObjectURL)
  uploadingImages = signal<Set<number>>(new Set()); // Índices das imagens sendo enviadas

  // Getter para garantir URLs absolutas ao exibir
  getImagemUrl(url: string): string {
    return getImageUrl(url);
  }

  // Handlers para debug de imagens
  onImageError(event: Event, url: string): void {
    const img = event.target as HTMLImageElement;
    console.error('❌ Erro ao carregar imagem:', {
      url: url,
      src: img.src,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight
    });
    // Tenta carregar a URL diretamente para verificar se está acessível
    fetch(url, { method: 'HEAD' })
      .then(response => {
        console.log('🔍 Verificação da URL:', {
          url: url,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        });
      })
      .catch(err => {
        console.error('🔍 Erro ao verificar URL:', err);
      });
  }

  onImageLoad(event: Event, url: string): void {
    const img = event.target as HTMLImageElement;
    console.log('✅ Imagem carregada com sucesso:', {
      url: url,
      src: img.src,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.activationValidationSub?.unsubscribe();
    // Limpa todas as URLs de preview para evitar vazamentos de memória
    this.previewUrls().forEach(url => URL.revokeObjectURL(url));
    this.previewUrls.set([]);
  }

  // Validação de ativação
  activationValidation = signal<{ canActivate: boolean; reasons: string[] } | null>(null);

  // Signal: Verifica se pode salvar (produto ativo precisa de estoque)
  canSave = signal(true);

  // UX: quando limitamos automaticamente o preço promocional (promo <= original)
  promoPriceLimitMessage = signal<string | null>(null);

  ngOnInit(): void {
    // Primeiro inicializa o formulário (deve ser sempre o primeiro)
    this.initForm();
    
    // Verifica se está editando
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      const productId = parseInt(id, 10);
      if (isNaN(productId)) {
        console.error('ID inválido:', id);
        this.error.set('ID do produto inválido');
        return;
      }
      this.productId.set(productId);
    }

    // Carrega categorias e lojas em paralelo
    // Depois, se estiver editando, carrega o produto
    forkJoin({
      // ✅ CORRIGIDO: Se estiver editando, carrega TODAS as categorias (para mostrar a categoria atual do produto)
      // Se não estiver editando, carrega apenas ativas (para seleção)
      categories: this.isEditMode() 
        ? this.categoryService.getCategories() 
        : this.productService.getActiveCategories(),
      lojas: this.productService.getActiveStores()
    }).subscribe({
      next: ({ categories, lojas }) => {
        console.log('Categorias e lojas carregadas:', { 
          categories, 
          lojas,
          isEditMode: this.isEditMode(),
          categoriesCount: categories.length
        });
        this.categories.set(categories);
        this.lojas.set(lojas);
        
        // Se não estiver editando, adiciona estoque inicial para todas as lojas
        if (!this.isEditMode()) {
          lojas.forEach(loja => {
            this.addEstoqueLoja(loja.id, 0);
          });
          // Atualiza validação após adicionar estoques iniciais
          setTimeout(() => this.updateCanSave(), 0);
        } else {
          // Se estiver editando, agora que categorias e lojas estão carregadas, carrega o produto
          const productId = this.productId();
          if (productId) {
            this.loadProduct(productId);
          }
        }
      },
      error: (err) => {
        console.error('Erro ao carregar categorias ou lojas:', err);
        this.error.set(`Erro ao carregar dados: ${err.message || 'Servidor não disponível. Verifique se o json-server está rodando na porta 3000.'}`);
        
        // Mesmo com erro, se estiver editando, tenta carregar o produto
        if (this.isEditMode()) {
          const productId = this.productId();
          if (productId) {
            this.loadProduct(productId);
          }
        }
      }
    });
  }

  private initForm(): void {
    this.productForm = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      descricao: ['', [Validators.required, Validators.minLength(10)]],
      categoriaId: [null, Validators.required],
      // Guardamos como string para impedir zeros à esquerda e aceitar vírgula (pt-BR)
      preco: ['', [Validators.required, this.currencyMinValidator(0.01)]],
      precoPromocional: ['', [this.currencyMinValidator(0.01)]],
      sku: ['', [Validators.required]],
      codigoBarras: ['', [Validators.required]],
      tamanhos: [[]],
      cores: [[]],
      estoquePorLoja: this.fb.array([]),
      imagens: [[]],
      status: ['INATIVO' as ProductStatus, Validators.required]
    });

    // ✅ MELHORADO: Valida SKU único com debounce
    // Flag para evitar validação durante carregamento de dados
    let isInitializing = true;
    
    this.productForm.get('sku')?.valueChanges.pipe(
      debounceTime(500), // Aguarda 500ms após usuário parar de digitar
      distinctUntilChanged() // Só valida se valor mudou
    ).pipe(takeUntil(this.destroy$)).subscribe(sku => {
      // Não valida durante inicialização (quando patchValue é chamado)
      if (isInitializing) {
        return;
      }
      
      if (sku && sku.trim().length >= 3) {
        this.productService.isSkuUnique(sku, this.productId() || undefined).subscribe({
          next: (isUnique) => {
            const skuControl = this.productForm.get('sku');
            if (!isUnique) {
              skuControl?.setErrors({ notUnique: true });
            } else {
              // Remove erro se SKU for único
              if (skuControl?.hasError('notUnique')) {
                const errors = { ...skuControl.errors };
                delete errors['notUnique'];
                skuControl.setErrors(Object.keys(errors).length > 0 ? errors : null);
              }
            }
          },
          error: () => {
            // Em caso de erro, não bloqueia o formulário
            console.error('Erro ao validar SKU');
          }
        });
      }
    });
    
    // Marca como não inicializando após um pequeno delay
    setTimeout(() => {
      isInitializing = false;
    }, 1000);

    // ✅ Validações em tempo real consolidadas (inclui estoque -> corrige bug do status)
    this.setupRealtimeValidationStreams();
  }

  private setupRealtimeValidationStreams(): void {
    const status = this.productForm.get('status');
    const nome = this.productForm.get('nome');
    const descricao = this.productForm.get('descricao');
    const categoriaId = this.productForm.get('categoriaId');
    const sku = this.productForm.get('sku');
    const codigoBarras = this.productForm.get('codigoBarras');
    const preco = this.productForm.get('preco');
    const precoPromocional = this.productForm.get('precoPromocional');
    const imagens = this.productForm.get('imagens');

    if (!status || !nome || !descricao || !categoriaId || !sku || !codigoBarras || !preco || !precoPromocional || !imagens) {
      return;
    }

    // Regras de preço em tempo real
    merge(preco.valueChanges, precoPromocional.valueChanges)
      .pipe(debounceTime(0), takeUntil(this.destroy$))
      .subscribe(() => this.enforcePromoPriceInvariant());

    // Regras de ativação/estoque/habilitação do submit (debounced)
    merge(
      status.valueChanges,
      nome.valueChanges,
      descricao.valueChanges,
      categoriaId.valueChanges,
      sku.valueChanges,
      codigoBarras.valueChanges,
      preco.valueChanges,
      precoPromocional.valueChanges,
      imagens.valueChanges,
      this.estoquePorLojaFormArray.valueChanges
    )
      .pipe(
        startWith(null),
        debounceTime(200),
        map(() => this.getActivationSignature()),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.updateCanSave();
        this.validateActiveProductStock();
        this.validateActivation();
      });
  }

  private getActivationSignature(): string {
    const cleaned = this.getCleanedFormDataForBusinessRules();
    return JSON.stringify({
      status: cleaned.status,
      nome: cleaned.nome?.trim() || '',
      descricao: cleaned.descricao?.trim() || '',
      categoriaId: cleaned.categoriaId ?? null,
      sku: cleaned.sku?.trim() || '',
      codigoBarras: cleaned.codigoBarras?.trim() || '',
      preco: cleaned.preco ?? null,
      precoPromocional: cleaned.precoPromocional ?? null,
      imagensCount: cleaned.imagens?.length ?? 0,
      estoque: (cleaned.estoquePorLoja || []).map(e => [e.lojaId, e.quantidade])
    });
  }

  private loadProduct(id: number): void {
    this.loading.set(true);
    this.productService.getProductById(id).subscribe({
      next: (product) => {
        // Usa patchValue com emitEvent: false para evitar disparar validações
        this.productForm.patchValue({
          nome: product.nome,
          descricao: product.descricao,
          categoriaId: product.categoriaId,
          preco: this.formatCurrencyInput(product.preco),
          precoPromocional: product.precoPromocional != null ? this.formatCurrencyInput(product.precoPromocional) : '',
          sku: product.sku,
          codigoBarras: product.codigoBarras,
          tamanhos: product.tamanhos,
          cores: product.cores,
          imagens: product.imagens,
          status: product.status
        }, { emitEvent: false });

        // Garantir que todas as URLs sejam absolutas do backend
        const imagensCompletas = product.imagens.map(img => {
          const url = getImageUrl(img);
          console.log('🖼️ Carregando imagem do produto:', { original: img, converted: url });
          return url;
        });
        console.log('🖼️ Todas as imagens do produto:', imagensCompletas);
        this.imagensUrls.set(imagensCompletas);
        this.tamanhosCustomizados.set(
          product.tamanhos.filter(t => !this.tamanhosPadrao.includes(t))
        );

        // Preenche estoque por loja
        // Garante que TODAS as lojas sejam exibidas, não apenas as que têm estoque
        this.estoquePorLojaFormArray.clear();
        
        // As lojas já devem estar carregadas (via forkJoin no ngOnInit)
        if (this.lojas().length === 0) {
          console.warn('Lojas ainda não carregadas ao tentar preencher estoque, aguardando...');
          // Se as lojas não estiverem carregadas, tenta novamente após um pequeno delay
          setTimeout(() => {
            this.fillEstoquePorLoja(product);
            this.updateFormValidity();
            // Atualiza validação após carregar produto (com delay para garantir que tudo foi preenchido)
            setTimeout(() => {
              this.updateCanSave();
              this.validateActiveProductStock();
              this.validateActivation();
            }, 150);
            this.loading.set(false);
          }, 200);
        } else {
          this.fillEstoquePorLoja(product);
          this.updateFormValidity();
          // Atualiza validação após carregar produto (com delay para garantir que tudo foi preenchido)
          setTimeout(() => {
            this.updateCanSave();
            this.validateActiveProductStock();
            this.validateActivation();
          }, 150);
          this.loading.set(false);
        }
      },
      error: (err) => {
        console.error('Erro ao carregar produto:', err);
        this.error.set('Erro ao carregar produto.');
        this.loading.set(false);
      }
    });
  }

  private loadCategories(): void {
    this.productService.getActiveCategories().subscribe({
      next: (categories) => {
        console.log('Categorias ativas carregadas no formulário:', categories);
        this.categories.set(categories);
        
        // Se estiver editando e as categorias foram carregadas, atualiza a validação
        if (this.isEditMode() && this.productId()) {
          this.updateFormValidity();
        }
      },
      error: (err) => {
        console.error('Erro ao carregar categorias no formulário:', err);
        console.error('Detalhes do erro:', {
          message: err.message,
          status: err.status,
          statusText: err.statusText,
          url: err.url
        });
        this.error.set(`Erro ao carregar categorias: ${err.message || 'Servidor não disponível'}`);
      }
    });
  }

  private loadLojas(): void {
    this.productService.getActiveStores().subscribe({
      next: (lojas) => {
        this.lojas.set(lojas);
        // Se não estiver editando, adiciona estoque inicial para todas as lojas
        if (!this.isEditMode()) {
          lojas.forEach(loja => {
            this.addEstoqueLoja(loja.id, 0);
          });
        } else {
          // Se estiver editando, agora que as lojas estão carregadas, carrega o produto
          // Isso garante que o formulário e as lojas estejam prontos
          const id = this.productId();
          if (id) {
            this.loadProduct(id);
          }
        }
      },
      error: (err) => {
        console.error('Erro ao carregar lojas:', err);
        // Mesmo com erro, se estiver editando, tenta carregar o produto
        if (this.isEditMode()) {
          const id = this.productId();
          if (id) {
            this.loadProduct(id);
          }
        }
      }
    });
  }

  get estoquePorLojaFormArray(): FormArray {
    return this.productForm.get('estoquePorLoja') as FormArray;
  }

  private fillEstoquePorLoja(product: Product): void {
    // Para cada loja disponível, verifica se tem estoque no produto
    this.lojas().forEach(loja => {
      // Compara lojaId tratando tipos diferentes (number vs string)
      const estoqueExistente = product.estoquePorLoja.find(
        e => {
          const estoqueLojaId = typeof e.lojaId === 'string' ? Number(e.lojaId) : e.lojaId;
          const lojaId = typeof loja.id === 'string' ? Number(loja.id) : loja.id;
          return estoqueLojaId === lojaId;
        }
      );
      
      // Se existe estoque, usa a quantidade, senão usa 0
      const quantidade = estoqueExistente ? estoqueExistente.quantidade : 0;
      
      // Adiciona o estoque com a quantidade correta
      this.addEstoqueLoja(loja.id, quantidade);
    });
    
    // Força detecção de mudanças para atualizar o template
    this.cdr.detectChanges();
    // Atualiza validação após preencher estoque (usar setTimeout para garantir que os listeners já foram adicionados)
    setTimeout(() => {
      this.updateCanSave();
      this.validateActiveProductStock();
    }, 100);
  }

  private updateFormValidity(): void {
    // Atualiza a validação do formulário após preencher todos os dados
    this.productForm.updateValueAndValidity({ emitEvent: false });
    
    // Limpa erros de validação que possam ter sido causados durante o carregamento
    // Garante que campos preenchidos corretamente não tenham erros
    Object.keys(this.productForm.controls).forEach(key => {
      const control = this.productForm.get(key);
      if (control && control.value && control.invalid) {
        // Se o campo tem valor mas está inválido, verifica se é um erro temporário
        if (control.hasError('notUnique') && this.isEditMode()) {
          // Em modo de edição, SKU do próprio produto não deve ser considerado duplicado
          const errors = { ...control.errors };
          delete errors['notUnique'];
          control.setErrors(Object.keys(errors).length > 0 ? errors : null);
        }
      }
    });
    
    // Força detecção de mudanças
    this.cdr.detectChanges();
  }

  addEstoqueLoja(lojaId: number | string, quantidade: number = 0): void {
    const estoqueGroup = this.fb.group({
      lojaId: [lojaId, Validators.required],
      quantidade: [quantidade, [Validators.required, Validators.min(0)]]
    });
    
    // Listener para mudanças de quantidade específica deste estoque
    estoqueGroup.get('quantidade')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.updateCanSave();
    });
    
    this.estoquePorLojaFormArray.push(estoqueGroup);
    // Atualiza imediatamente após adicionar
    this.updateCanSave();
  }

  getEstoqueControl(index: number): AbstractControl {
    return this.estoquePorLojaFormArray.at(index);
  }

  getQuantidadeControl(index: number): FormControl {
    const control = this.estoquePorLojaFormArray.at(index).get('quantidade');
    if (!control) {
      throw new Error(`FormControl 'quantidade' não encontrado no índice ${index}`);
    }
    return control as FormControl;
  }

  getCores(): string[] {
    return (this.productForm.get('cores')?.value as string[]) || [];
  }

  hasCores(): boolean {
    const cores = this.getCores();
    return cores.length > 0;
  }

  getLojaName(lojaId: number): string {
    return this.lojas().find(l => l.id === lojaId)?.nome || 'N/A';
  }

  // Tamanhos
  toggleTamanho(tamanho: string): void {
    const tamanhos = this.productForm.get('tamanhos')?.value as string[];
    const index = tamanhos.indexOf(tamanho);

    if (index > -1) {
      tamanhos.splice(index, 1);
    } else {
      tamanhos.push(tamanho);
    }

    this.productForm.patchValue({ tamanhos });
  }

  isTamanhoSelected(tamanho: string): boolean {
    const tamanhos = this.productForm.get('tamanhos')?.value as string[];
    return tamanhos.includes(tamanho);
  }

  addCustomTamanho(tamanho: string): void {
    if (tamanho.trim() && !this.tamanhosCustomizados().includes(tamanho.trim())) {
      this.tamanhosCustomizados.update(tamanhos => [...tamanhos, tamanho.trim()]);
      this.toggleTamanho(tamanho.trim());
    }
  }

  removeCustomTamanho(tamanho: string): void {
    this.tamanhosCustomizados.update(tamanhos => tamanhos.filter(t => t !== tamanho));
    this.toggleTamanho(tamanho);
  }

  // Cores
  addCor(cor: string): void {
    if (cor.trim()) {
      const cores = this.productForm.get('cores')?.value as string[];
      if (!cores.includes(cor.trim())) {
        cores.push(cor.trim());
        this.productForm.patchValue({ cores });
      }
    }
  }

  removeCor(cor: string): void {
    const cores = this.productForm.get('cores')?.value as string[];
    const index = cores.indexOf(cor);
    if (index > -1) {
      cores.splice(index, 1);
      this.productForm.patchValue({ cores });
    }
  }

  // Imagens
  addImagem(url: string): void {
    if (url.trim()) {
      const imagens = this.productForm.get('imagens')?.value as string[];
      const totalImagens = imagens.length + this.selectedFiles().length;
      if (totalImagens < 8) {
        // Valida formato
        if (this.productService.validateImageFormat(url)) {
          // Garante que a URL seja absoluta
          const urlAbsoluta = getImageUrl(url.trim());
          imagens.push(urlAbsoluta);
          this.productForm.patchValue({ imagens });
          this.imagensUrls.set([...imagens]);
        } else {
          this.error.set('Formato de imagem inválido. Use JPG, PNG ou WebP.');
        }
      } else {
        this.error.set('Máximo de 8 imagens permitidas.');
      }
    }
  }

  // Getter para total de imagens (salvas + previews)
  getTotalImagens(): number {
    return this.imagensUrls().length + this.previewUrls().length;
  }

  removeImagem(index: number): void {
    const imagens = this.productForm.get('imagens')?.value as string[];
    imagens.splice(index, 1);
    this.productForm.patchValue({ imagens });
    this.imagensUrls.set([...imagens]);
    this.validateActivation();
  }

  // Validação de ativação
  private updateCanSave(): void {
    // Força atualização do formulário antes de ler valores
    this.productForm.updateValueAndValidity({ emitEvent: false });
    
    const status = this.productForm.get('status')?.value;
    
    // Produto inativo sempre pode salvar
    if (status !== 'ATIVO') {
      this.canSave.set(true);
      return;
    }

    // Produto ativo precisa de estoque > 0 em pelo menos uma loja ativa
    const estoques = this.estoquePorLojaFormArray.value as Array<{ lojaId: number | string; quantidade: number | string }>;
    const lojasAtivas = this.lojas().filter(l => l.status === 'ATIVA');
    
    // Garantir que valores sejam números
    const temEstoque = estoques.some(estoque => {
      const lojaId = typeof estoque.lojaId === 'string' ? parseInt(estoque.lojaId, 10) : estoque.lojaId;
      const quantidade = typeof estoque.quantidade === 'string' ? parseInt(estoque.quantidade, 10) : estoque.quantidade;
      
      const loja = lojasAtivas.find(l => {
        const lId = typeof l.id === 'string' ? parseInt(l.id, 10) : l.id;
        return lId === lojaId;
      });
      
      return loja && quantidade > 0;
    });
    
    this.canSave.set(temEstoque);
  }

  private validateActiveProductStock(): void {
    const status = this.productForm.get('status')?.value;
    if (status !== 'ATIVO') {
      this.activationValidation.set(null);
      return;
    }

    const estoques = this.estoquePorLojaFormArray.value as Array<{ lojaId: number | string; quantidade: number | string }>;
    const lojasAtivas = this.lojas().filter(l => l.status === 'ATIVA');
    
    // Garantir que valores sejam números
    const temEstoque = estoques.some(estoque => {
      const lojaId = typeof estoque.lojaId === 'string' ? parseInt(estoque.lojaId, 10) : estoque.lojaId;
      const quantidade = typeof estoque.quantidade === 'string' ? parseInt(estoque.quantidade, 10) : estoque.quantidade;
      
      const loja = lojasAtivas.find(l => {
        const lId = typeof l.id === 'string' ? parseInt(l.id, 10) : l.id;
        return lId === lojaId;
      });
      
      return loja && quantidade > 0;
    });

    if (!temEstoque) {
      this.activationValidation.set({
        canActivate: false,
        reasons: ['Produto ATIVO deve ter estoque > 0 em pelo menos uma loja ATIVA']
      });
    } else {
      this.activationValidation.set(null);
    }
  }

  private validateActivation(): void {
    const statusControl = this.productForm.get('status');
    if (!statusControl) return;
    
    if (statusControl.value === 'ATIVO') {
      // Cancela validação anterior para evitar corrida (race condition)
      this.activationValidationSub?.unsubscribe();
      const formData = this.getCleanedFormDataForBusinessRules();
      this.activationValidationSub = this.productService.canActivateProduct(formData).subscribe({
        next: (validation) => {
          this.activationValidation.set(validation);
          if (!validation.canActivate) {
            // ✅ Adiciona erro se não pode ativar
            statusControl.setErrors({ ...(statusControl.errors || {}), cannotActivate: true });
          } else {
            // ✅ IMPORTANTE: Limpa o erro se pode ativar
            const currentErrors = statusControl.errors || {};
            const errors = { ...currentErrors };
            delete errors['cannotActivate'];
            statusControl.setErrors(Object.keys(errors).length > 0 ? errors : null);
          }
        }
      });
    } else {
      this.activationValidationSub?.unsubscribe();
      // ✅ IMPORTANTE: Quando status não é ATIVO, limpa o erro e a validação
      this.activationValidation.set(null);
      const currentErrors = statusControl.errors || {};
      const errors = { ...currentErrors };
      delete errors['cannotActivate'];
      statusControl.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      this.markFormGroupTouched(this.productForm);
      return;
    }

    // Validação adicional: produto ativo precisa de estoque
    const status = this.productForm.get('status')?.value;
    if (status === 'ATIVO' && !this.canSave()) {
      this.error.set('Produto ATIVO deve ter estoque > 0 em pelo menos uma loja ATIVA');
      this.validateActiveProductStock();
      return;
    }

    // Valida ativação antes de submeter
    if (status === 'ATIVO') {
      const formData = this.getCleanedFormDataForBusinessRules();
      this.productService.canActivateProduct(formData).subscribe({
        next: (validation) => {
          if (!validation.canActivate) {
            this.error.set(
              'Não é possível ativar o produto: ' + validation.reasons.join(', ')
            );
            this.activationValidation.set(validation);
            return;
          }
          this.saveProduct();
        }
      });
    } else {
      this.saveProduct();
    }
  }

  private async saveProduct(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      // Primeiro, fazer upload das imagens se houver arquivos selecionados
      const imageUrls = await this.uploadImages();
      
      // Atualizar o formulário com as URLs das imagens
      this.productForm.patchValue({ imagens: imageUrls });
      this.imagensUrls.set(imageUrls);

      // Reforça invariantes antes de montar payload (promo <= original, normalização)
      this.enforcePromoPriceInvariant();
      const formData: ProductFormData = this.getCleanedFormDataForBusinessRules();

      const cleanedData: ProductFormData = {
        ...formData,
        imagens: imageUrls, // Usar URLs do upload
      };

      const productId = this.productId();
      if (this.isEditMode() && !productId) {
        this.error.set('ID do produto não encontrado');
        this.loading.set(false);
        return;
      }

      console.log('Salvando produto:', {
        isEditMode: this.isEditMode(),
        productId: productId,
        data: cleanedData
      });

      const operation = this.isEditMode()
        ? this.productService.updateProduct(productId!, cleanedData)
        : this.productService.createProduct(cleanedData);

      operation.subscribe({
        next: (result) => {
          console.log('Produto salvo com sucesso:', result);
          this.router.navigate(['/produtos']);
        },
        error: (err) => {
          console.error('Erro ao salvar produto:', err);
          console.error('Detalhes do erro:', {
            status: err.status,
            statusText: err.statusText,
            url: err.url,
            error: err.error
          });
          
          // Extrair mensagem de erro do backend
          let errorMessage = 'Erro ao salvar produto. Tente novamente.';
          
          if (err.status === 404) {
            errorMessage = 'Produto não encontrado. Verifique se o produto ainda existe.';
          } else if (err.error) {
            if (err.error.message) {
              errorMessage = err.error.message;
            } else if (err.error.errors && Array.isArray(err.error.errors)) {
              // Se houver múltiplos erros de validação
              const errorMessages = err.error.errors.map((e: any) => `${e.field}: ${e.message}`).join(', ');
              errorMessage = `Erro de validação: ${errorMessages}`;
            }
          }
          
          this.error.set(errorMessage);
          this.loading.set(false);
        }
      });
    } catch (err: any) {
      console.error('Erro ao fazer upload ou salvar produto:', err);
      this.error.set('Erro ao processar imagens ou salvar produto.');
      this.loading.set(false);
    }
  }

  onCancel(): void {
    this.router.navigate(['/produtos']);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormArray) {
        control.controls.forEach(arrayControl => {
          if (arrayControl instanceof FormGroup) {
            this.markFormGroupTouched(arrayControl);
          }
        });
      }
    });
  }

  getFieldError(fieldName: string): string | null {
    const field = this.productForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return 'Este campo é obrigatório';
      }
      if (field.errors['minlength']) {
        const requiredLength = field.errors['minlength'].requiredLength;
        return `Mínimo de ${requiredLength} caracteres`;
      }
      if (field.errors['min']) {
        return 'Valor deve ser maior que zero';
      }
      if (field.errors['currencyInvalid']) {
        return 'Informe um valor numérico válido';
      }
      if (field.errors['currencyMin']) {
        return 'Valor deve ser maior que zero';
      }
      // ✅ MELHORADO: Mensagem mais clara para SKU duplicado
      if (field.errors['notUnique']) {
        return 'Este SKU já está em uso. Escolha outro.';
      }
      if (field.errors['cannotActivate']) {
        return 'Produto não pode ser ativado';
      }
    }
    return null;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.productForm.get(fieldName);
    return !!(field?.invalid && field.touched);
  }

  getDiscountPercent(): number | null {
    const preco = this.parseCurrencyInput(this.productForm.get('preco')?.value);
    const precoPromocional = this.parseCurrencyInput(this.productForm.get('precoPromocional')?.value);
    if (preco != null && precoPromocional != null) {
      return this.productService.calculateDiscountPercent(preco, precoPromocional);
    }
    return null;
  }

  // ==========================
  // Sanitização/normalização numérica (tempo real)
  // ==========================

  onCurrencyInput(controlName: 'preco' | 'precoPromocional', event: Event): void {
    const input = event.target as HTMLInputElement;
    const ctrl = this.productForm.get(controlName);
    if (!ctrl) return;

    const sanitized = this.sanitizeCurrencyString(input.value);
    if (sanitized !== input.value) {
      input.value = sanitized;
    }

    if (ctrl.value !== sanitized) {
      ctrl.setValue(sanitized, { emitEvent: true });
    }
  }

  onCurrencyBlur(controlName: 'preco' | 'precoPromocional'): void {
    const ctrl = this.productForm.get(controlName);
    if (!ctrl) return;

    const parsed = this.parseCurrencyInput(ctrl.value);
    if (parsed == null) {
      if (ctrl.value !== '') {
        ctrl.setValue('', { emitEvent: false });
      }
      this.enforcePromoPriceInvariant();
      return;
    }

    const formatted = this.formatCurrencyInput(parsed);
    if (ctrl.value !== formatted) {
      ctrl.setValue(formatted, { emitEvent: false });
    }
    this.enforcePromoPriceInvariant();
  }

  onStockInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const ctrl = this.getQuantidadeControl(index);
    const sanitized = this.sanitizeIntegerString(input.value);

    if (sanitized !== input.value) {
      input.value = sanitized;
    }
    if (ctrl.value !== sanitized) {
      ctrl.setValue(sanitized, { emitEvent: true });
    }
  }

  private enforcePromoPriceInvariant(): void {
    const precoCtrl = this.productForm.get('preco');
    const promoCtrl = this.productForm.get('precoPromocional');
    if (!precoCtrl || !promoCtrl) return;

    const preco = this.parseCurrencyInput(precoCtrl.value);
    const promo = this.parseCurrencyInput(promoCtrl.value);

    // Promo vazio: limpa mensagem
    if (promo == null) {
      this.promoPriceLimitMessage.set(null);
      return;
    }

    // Sem preço original válido ainda: não limita (evita brigar com digitação)
    if (preco == null) {
      return;
    }

    if (promo > preco) {
      promoCtrl.setValue(this.formatCurrencyInput(preco), { emitEvent: false });
      this.promoPriceLimitMessage.set(
        'Preço promocional não pode ser maior que o preço original. Ajustamos automaticamente para o máximo permitido.'
      );
    } else {
      this.promoPriceLimitMessage.set(null);
    }
  }

  private sanitizeCurrencyString(raw: string): string {
    // Mantém apenas dígitos e separadores
    let v = (raw || '').replace(/[^\d.,]/g, '');
    // Normaliza para vírgula como separador decimal
    v = v.replace(/\./g, ',');

    if (v.startsWith(',')) {
      v = '0' + v;
    }

    const parts = v.split(',');
    let intPart = parts[0] ?? '';
    let decPart = parts.slice(1).join('');

    // Remove zeros à esquerda quando não faz sentido (ex: 099 -> 99)
    intPart = intPart.replace(/^0+(?=\d)/, '');
    if (intPart === '' && (decPart.length > 0 || v.includes(','))) {
      intPart = '0';
    }
    // Se usuário digitou apenas zeros (ex: "00"), mantém "0" por coerência visual
    if (intPart === '' && decPart.length === 0 && /0/.test(v)) {
      intPart = '0';
    }

    // Limita casas decimais
    if (decPart.length > 2) {
      decPart = decPart.slice(0, 2);
    }

    return decPart.length > 0 ? `${intPart},${decPart}` : intPart;
  }

  private sanitizeIntegerString(raw: string): string {
    let v = (raw || '').replace(/[^\d]/g, '');
    v = v.replace(/^0+(?=\d)/, '');
    if (v === '' && /0/.test(raw || '')) {
      v = '0';
    }
    return v;
  }

  private parseCurrencyInput(value: unknown): number | null {
    if (value == null) return null;
    const s = String(value).trim();
    if (s === '') return null;
    // Remove separadores de milhar (.) e converte decimal (,) para ponto
    const normalized = s.replace(/\./g, '').replace(',', '.');
    const n = Number(normalized);
    return Number.isFinite(n) ? n : null;
  }

  private formatCurrencyInput(value: number): string {
    return value.toFixed(2).replace('.', ',');
  }

  private currencyMinValidator(min: number): ValidatorFn {
    return (control: AbstractControl) => {
      const raw = control.value;
      if (raw == null) return null;
      const s = String(raw).trim();
      // vazio: deixa o required (se houver) cuidar
      if (s === '') return null;

      const n = this.parseCurrencyInput(raw);
      if (n == null) return { currencyInvalid: true };
      return n >= min ? null : { currencyMin: { min, actual: n } };
    };
  }

  private getCleanedFormDataForBusinessRules(): ProductFormData {
    const raw = this.productForm.value as any;
    const preco = this.parseCurrencyInput(raw.preco);
    const promo = this.parseCurrencyInput(raw.precoPromocional);

    const estoquePorLoja = Array.isArray(raw.estoquePorLoja)
      ? raw.estoquePorLoja.map((estoque: any) => ({
          lojaId: typeof estoque.lojaId === 'string' ? parseInt(estoque.lojaId, 10) : estoque.lojaId,
          quantidade:
            typeof estoque.quantidade === 'string'
              ? parseInt(estoque.quantidade === '' ? '0' : estoque.quantidade, 10)
              : estoque.quantidade,
        }))
      : [];

    return {
      nome: raw.nome,
      descricao: raw.descricao,
      categoriaId: typeof raw.categoriaId === 'string' ? parseInt(raw.categoriaId, 10) : raw.categoriaId,
      preco: preco ?? 0,
      precoPromocional: promo == null ? null : promo,
      sku: raw.sku,
      codigoBarras: raw.codigoBarras,
      tamanhos: raw.tamanhos || [],
      cores: raw.cores || [],
      estoquePorLoja,
      imagens: raw.imagens || [],
      status: raw.status as ProductStatus,
    };
  }

  // Upload de arquivos
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const files = Array.from(input.files);
      // Limita a 8 arquivos no total (incluindo os já salvos e os selecionados)
      const totalImagens = this.imagensUrls().length + this.selectedFiles().length;
      const remainingSlots = Math.max(0, 8 - totalImagens);
      const filesToAdd = files.slice(0, remainingSlots);
      
      if (filesToAdd.length === 0) {
        this.error.set('Máximo de 8 imagens permitidas.');
        input.value = '';
        return;
      }
      
      // Adiciona os arquivos selecionados
      const currentLength = this.selectedFiles().length;
      this.selectedFiles.update(selected => [...selected, ...filesToAdd]);
      
      // Cria previews locais para os novos arquivos
      const newPreviewUrls = filesToAdd.map(file => URL.createObjectURL(file));
      this.previewUrls.update(previews => [...previews, ...newPreviewUrls]);
      
      // Faz upload automático de cada arquivo
      filesToAdd.forEach((file, index) => {
        const globalIndex = currentLength + index;
        this.uploadSingleImage(file, globalIndex);
      });
      
      // Limpa o input para permitir selecionar os mesmos arquivos novamente se necessário
      input.value = '';
    }
  }

  // Faz upload de uma única imagem
  private uploadSingleImage(file: File, previewIndex: number): void {
    // Marca como fazendo upload
    this.uploadingImages.update(uploading => new Set([...uploading, previewIndex]));
    
    this.uploadService.uploadProductImage(file).subscribe({
      next: (response) => {
        console.log('✅ Upload concluído:', response);
        
        // Converte a URL para absoluta
        const imageUrl = getImageUrl(response.url);
        
        // Adiciona a URL às imagens do produto
        const imagens = this.productForm.get('imagens')?.value as string[];
        imagens.push(imageUrl);
        this.productForm.patchValue({ imagens });
        this.imagensUrls.update(urls => [...urls, imageUrl]);
        
        // Remove o preview local e o arquivo
        const previewUrl = this.previewUrls()[previewIndex];
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
        
        this.selectedFiles.update(files => files.filter((_, i) => i !== previewIndex));
        this.previewUrls.update(previews => previews.filter((_, i) => i !== previewIndex));
        
        // Remove do conjunto de uploads
        this.uploadingImages.update(uploading => {
          const newSet = new Set(uploading);
          newSet.delete(previewIndex);
          return newSet;
        });
      },
      error: (err) => {
        console.error('❌ Erro ao fazer upload da imagem:', err);
        this.error.set(`Erro ao fazer upload da imagem "${file.name}": ${err.message || 'Erro desconhecido'}`);
        
        // Remove o preview local e o arquivo em caso de erro
        const previewUrl = this.previewUrls()[previewIndex];
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
        
        this.selectedFiles.update(files => files.filter((_, i) => i !== previewIndex));
        this.previewUrls.update(previews => previews.filter((_, i) => i !== previewIndex));
        
        // Remove do conjunto de uploads
        this.uploadingImages.update(uploading => {
          const newSet = new Set(uploading);
          newSet.delete(previewIndex);
          return newSet;
        });
      }
    });
  }

  // Verifica se uma imagem está sendo enviada
  isUploading(index: number): boolean {
    return this.uploadingImages().has(index);
  }

  removeSelectedFile(index: number): void {
    // Verifica se está fazendo upload
    if (this.isUploading(index)) {
      this.error.set('Aguarde o upload terminar antes de remover a imagem.');
      return;
    }
    
    // Remove o preview URL antes de remover o arquivo
    const previewUrl = this.previewUrls()[index];
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    
    // Remove o arquivo e o preview
    this.selectedFiles.update(files => files.filter((_, i) => i !== index));
    this.previewUrls.update(previews => previews.filter((_, i) => i !== index));
    
    // Remove do conjunto de uploads se estiver lá
    this.uploadingImages.update(uploading => {
      const newSet = new Set(uploading);
      newSet.delete(index);
      return newSet;
    });
  }

  async uploadImages(): Promise<string[]> {
    // Como agora fazemos upload automático, apenas retorna as URLs já existentes
    // Se ainda houver arquivos sendo enviados, aguarda um pouco
    if (this.uploadingImages().size > 0) {
      console.log('⏳ Aguardando uploads em andamento...');
      // Aguarda até 10 segundos para os uploads terminarem
      let attempts = 0;
      while (this.uploadingImages().size > 0 && attempts < 20) {
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }
      
      if (this.uploadingImages().size > 0) {
        throw new Error('Alguns uploads ainda estão em andamento. Aguarde um momento e tente novamente.');
      }
    }
    
    // Retorna as URLs já existentes (que já foram enviadas automaticamente)
    return this.imagensUrls();
  }
}


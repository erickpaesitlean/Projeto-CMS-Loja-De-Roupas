import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryService } from '../../../services/category.service';
import { Category, CategoryFormData, CategoryStatus } from '../../../models/category.model';
import { IconComponent } from '../../../shared/icons/icon.component';
import { CategoryDeactivateModalComponent } from '../category-deactivate-modal/category-deactivate-modal.component';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent, CategoryDeactivateModalComponent],
  templateUrl: './category-form.component.html',
  styleUrl: './category-form.component.scss'
})
export class CategoryFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly categoryService = inject(CategoryService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  categoryForm!: FormGroup;
  isEditMode = signal(false);
  categoryId = signal<number | string | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  parentCategories = signal<Category[]>([]);
  currentCategory = signal<Category | null>(null);
  deactivateModalOpen = signal(false);
  originalStatus: CategoryStatus | null = null;

  ngOnInit(): void {
    // ✅ IMPORTANTE: Inicializar o formulário PRIMEIRO
    this.initForm();

    // Verificar se está em modo de edição e carregar dados (por slug)
    // ✅ Usar route.params para garantir que pegamos os parâmetros da rota filha
    this.route.params.subscribe(params => {
      const slugOrId = params['slug'] ?? params['id'];
      if (slugOrId) {
        this.isEditMode.set(true);
        // Carrega a categoria por slug (ou fallback por ID numérico)
        this.loadCategoryByIdentifier(String(slugOrId));
      } else {
        // Modo criação: carregar categorias pai disponíveis
        this.loadParentCategories();
      }
    });
  }

  private initForm(): void {
    this.categoryForm = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      descricao: ['', [Validators.required, Validators.minLength(10)]],
      categoriaPaiId: [null],
      status: ['ATIVA' as CategoryStatus, Validators.required]
    });

    // ✅ NOVA VALIDAÇÃO: Observar mudanças em categoriaPaiId
    this.categoryForm.get('categoriaPaiId')?.valueChanges.subscribe(categoriaPaiId => {
      if (categoriaPaiId) {
        // Validar se não é ela mesma (comparando como string para suportar IDs string e number)
        if (String(this.currentCategory()?.id ?? this.categoryId()) === String(categoriaPaiId)) {
          this.categoryForm.get('categoriaPaiId')?.setErrors({ selfParent: true });
          this.error.set('Uma categoria não pode ser pai de si mesma.');
        } else {
          // Validar nível hierárquico
          this.categoryService.validateMaxLevel(categoriaPaiId, this.currentCategory()?.id ?? undefined)
            .subscribe({
              next: (validation) => {
                if (!validation.valid) {
                  this.categoryForm.get('categoriaPaiId')?.setErrors({ maxLevel: true });
                  this.error.set(validation.message || 'Erro na validação de hierarquia.');
                } else {
                  const control = this.categoryForm.get('categoriaPaiId');
                  if (control?.hasError('selfParent') || control?.hasError('maxLevel') || control?.hasError('inactiveParent')) {
                    const errors = { ...control.errors };
                    delete errors['selfParent'];
                    delete errors['maxLevel'];
                    delete errors['inactiveParent'];
                    control.setErrors(Object.keys(errors).length > 0 ? errors : null);
                  }
                  this.error.set(null);
                }
              },
              error: () => {
                this.error.set('Erro ao validar hierarquia.');
              }
            });
        }
      } else {
        // Limpar erros se categoria pai for removida
        const control = this.categoryForm.get('categoriaPaiId');
        if (control?.hasError('selfParent') || control?.hasError('maxLevel') || control?.hasError('inactiveParent')) {
          const errors = { ...control.errors };
          delete errors['selfParent'];
          delete errors['maxLevel'];
          delete errors['inactiveParent'];
          control.setErrors(Object.keys(errors).length > 0 ? errors : null);
        }
        this.error.set(null);
      }
    });
  }

  private loadCategoryByIdentifier(identifier: string): void {
    this.loading.set(true);
    const isNumericId = /^\d+$/.test(identifier);
    const request$ = isNumericId
      ? this.categoryService.getCategoryById(Number(identifier))
      : this.categoryService.getCategoryBySlug(identifier);

    request$.subscribe({
      next: (category) => {
        this.currentCategory.set(category);
        this.originalStatus = category.status;
        // Mantém o ID real para operações internas
        this.categoryId.set(category.id);
        // ✅ Garantir conversão de tipos (categoriaPaiId pode vir como string do JSON Server)
        const categoriaPaiId = category.categoriaPaiId !== null && category.categoriaPaiId !== undefined
          ? (typeof category.categoriaPaiId === 'string' ? Number(category.categoriaPaiId) : category.categoriaPaiId)
          : null;
        
        this.categoryForm.patchValue({
          nome: category.nome,
          descricao: category.descricao,
          categoriaPaiId: categoriaPaiId,
          status: category.status
        });

        // Carregar categorias pai disponíveis excluindo a própria (agora temos ID real)
        this.loadParentCategories();

        // Canonicaliza URL: se veio por ID numérico (ou slug antigo), redireciona para slug atual
        const desiredUrl = `/categorias/${category.slug}/editar`;
        if (this.router.url !== desiredUrl) {
          this.router.navigate(['/categorias', category.slug, 'editar'], { replaceUrl: true });
        }

        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar categoria:', err);
        this.error.set('Erro ao carregar categoria.');
        this.loading.set(false);
      }
    });
  }

  private loadParentCategories(): void {
    const excludeId = this.currentCategory()?.id ?? undefined;
    this.categoryService.getActiveCategories(excludeId).subscribe({
      next: (categories) => {
        this.parentCategories.set(categories);
      },
      error: (err) => {
        console.error('Erro ao carregar categorias pai:', err);
      }
    });
  }

  onSubmit(): void {
    if (this.categoryForm.invalid) {
      this.markFormGroupTouched(this.categoryForm);
      return;
    }

    const newStatus = this.categoryForm.get('status')?.value as CategoryStatus;
    const isTryingToDeactivate = this.isEditMode() && 
                                  this.originalStatus === 'ATIVA' && 
                                  newStatus === 'INATIVA';

    // Se está tentando inativar, verificar se tem produtos
    if (isTryingToDeactivate && this.currentCategory()) {
      // ✅ CORRIGIDO: considerar produtos vinculados também a categorias filhas (hierarquia completa)
      this.categoryService.getProductsWithChildren(Number(this.categoryId())).subscribe({
        next: (data) => {
          if (data.totalProdutos > 0) {
            // Tem produtos (na categoria OU em filhas), mostrar modal de realocação
            this.deactivateModalOpen.set(true);
            // Reverter status no formulário
            this.categoryForm.patchValue({ status: this.originalStatus });
          } else {
            // Não tem produtos, pode inativar diretamente
            this.saveCategory();
          }
        },
        error: (err) => {
          console.error('Erro ao verificar produtos (com filhas):', err);
          this.error.set('Erro ao verificar produtos associados.');
        }
      });
    } else {
      // Não está tentando inativar ou não está em modo de edição
      this.saveCategory();
    }
  }

  private saveCategory(): void {
    // Gera slug automaticamente a partir do nome
    const nome = this.categoryForm.get('nome')?.value;
    const slug = nome ? this.categoryService.generateSlug(nome) : '';
    
    // Garantir que categoriaPaiId seja number ou null, não string
    const categoriaPaiIdValue = this.categoryForm.get('categoriaPaiId')?.value;
    const categoriaPaiId = categoriaPaiIdValue === null || categoriaPaiIdValue === '' 
      ? null 
      : (typeof categoriaPaiIdValue === 'string' ? Number(categoriaPaiIdValue) : categoriaPaiIdValue);
    
    const formData: CategoryFormData = {
      ...this.categoryForm.value,
      slug: slug,
      categoriaPaiId: categoriaPaiId
    };

    // ✅ NOVA VALIDAÇÃO: Verificar se não é pai de si mesma
    if (!this.categoryService.validateNotSelfParent(
      this.categoryId(),
      formData.categoriaPaiId
    )) {
      this.error.set('Uma categoria não pode ser pai de si mesma.');
      return;
    }

    // ✅ NOVA VALIDAÇÃO: Verificar limite de 3 níveis
    this.categoryService.validateMaxLevel(
      formData.categoriaPaiId,
      this.categoryId() || undefined
    ).subscribe({
      next: (validation) => {
        if (!validation.valid) {
          this.error.set(validation.message || 'Erro na validação de hierarquia.');
          return;
        }

        // Prosseguir com criação/edição
        this.loading.set(true);
        this.error.set(null);

        // Garantir que o ID seja um número se estiver em modo de edição
        const categoryId = this.isEditMode() 
          ? (typeof this.categoryId() === 'string' ? Number(this.categoryId()) : this.categoryId())
          : null;

        const operation = this.isEditMode()
          ? this.categoryService.updateCategory(categoryId!, formData)
          : this.categoryService.createCategory(formData);

        console.log('[CategoryFormComponent] Salvando categoria', {
          isEditMode: this.isEditMode(),
          categoryId: categoryId,
          originalCategoryId: this.categoryId(),
          formData
        });
        console.log('[CategoryFormComponent] FormData JSON:', JSON.stringify(formData, null, 2));

        operation.subscribe({
          next: (result) => {
            console.log('[CategoryFormComponent] Categoria salva com sucesso', result);
            this.router.navigate(['/categorias']);
          },
          error: (err) => {
            console.error('[CategoryFormComponent] Erro ao salvar categoria:', err);
            console.error('[CategoryFormComponent] Detalhes do erro:', {
              status: err.status,
              statusText: err.statusText,
              message: err.message,
              error: err.error,
              url: err.url
            });
            
            // Log detalhado do objeto error completo
            console.error('[CategoryFormComponent] Objeto error completo:', JSON.stringify(err.error, null, 2));
            
            // ✅ Se backend bloqueou por regra de domínio (produtos vinculados na hierarquia), abrir modal
            if (err.status === 409 && err.error?.code === 'CATEGORY_HAS_LINKED_PRODUCTS' && this.currentCategory()) {
              this.error.set(err.error?.message || 'Não é possível inativar categoria com produtos vinculados.');
              this.deactivateModalOpen.set(true);
              // Reverter status no formulário para evitar estado inconsistente na UI
              this.categoryForm.patchValue({ status: this.originalStatus });
              this.loading.set(false);
              return;
            }

            // Se for erro de validação (400), mostrar mensagens específicas
            if (err.status === 400) {
              if (err.error?.errors && Array.isArray(err.error.errors)) {
                // ✅ Se o backend enviar errors vazio (ou já veio normalizado), cai para mensagem descritiva
                if (err.error.errors.length === 0 && err.error?.message) {
                  this.error.set(err.error.message);
                  this.loading.set(false);
                  return;
                }
                const errorMessages = err.error.errors.map((e: any) => {
                  if (typeof e === 'string') return e;
                  if (e.message) return `${e.field || ''}: ${e.message}`;
                  return JSON.stringify(e);
                }).join(', ');
                this.error.set(errorMessages ? `Erro de validação: ${errorMessages}` : (err.error?.message || 'Erro de validação.'));
              } else if (err.error?.message) {
                // ✅ Mostra a mensagem do domínio sem prefixo genérico
                this.error.set(err.error.message);

                // UX: se a mensagem é sobre categoria pai inativa, marca o campo no formulário
                if (String(err.error.message).toLowerCase().includes('categoria pai') && String(err.error.message).toLowerCase().includes('ativa')) {
                  const control = this.categoryForm.get('categoriaPaiId');
                  control?.setErrors({ ...(control.errors || {}), inactiveParent: true });
                  control?.markAsTouched();
                }
              } else {
                this.error.set('Erro de validação. Verifique os campos do formulário.');
              }
            } else {
              this.error.set(err.error?.message || 'Erro ao salvar categoria. Tente novamente.');
            }
            this.loading.set(false);
          }
        });
      },
      error: (err) => {
        console.error('Erro na validação:', err);
        this.error.set('Erro ao validar categoria.');
      }
    });
  }

  onDeactivateConfirm(data: { action: 'remove' | 'relocate'; targetCategoryId?: number }): void {
    const category = this.currentCategory();
    if (!category) return;

    if (data.action === 'relocate' && data.targetCategoryId) {
      // Inativar com realocação
      this.categoryService.deactivateCategoryWithRelocation(category.id, data.targetCategoryId).subscribe({
        next: () => {
          this.deactivateModalOpen.set(false);
          this.router.navigate(['/categorias']);
        },
        error: (err) => {
          console.error('Erro ao inativar categoria com realocação:', err);
          this.error.set(err.error?.message || 'Erro ao inativar categoria. Tente novamente.');
          this.deactivateModalOpen.set(false);
        }
      });
    } else {
      // Inativar sem produtos
      this.categoryService.deactivateCategoryWithCascade(category.id).subscribe({
        next: () => {
          this.deactivateModalOpen.set(false);
          this.router.navigate(['/categorias']);
        },
        error: (err) => {
          console.error('Erro ao inativar categoria:', err);
          this.error.set(err.error?.message || 'Erro ao inativar categoria. Tente novamente.');
          this.deactivateModalOpen.set(false);
        }
      });
    }
  }

  closeDeactivateModal(): void {
    this.deactivateModalOpen.set(false);
  }

  onCancel(): void {
    this.router.navigate(['/categorias']);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string | null {
    const field = this.categoryForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return 'Este campo é obrigatório';
      }
      if (field.errors['minlength']) {
        const requiredLength = field.errors['minlength'].requiredLength;
        return `Mínimo de ${requiredLength} caracteres`;
      }
      // ✅ NOVO: Erro de auto-referência
      if (field.errors['selfParent']) {
        return 'Uma categoria não pode ser pai de si mesma.';
      }
      // ✅ NOVO: Erro de nível máximo
      if (field.errors['maxLevel']) {
        return 'Limite de 3 níveis hierárquicos atingido.';
      }
      // ✅ NOVO: Categoria pai inativa ao tentar ativar
      if (field.errors['inactiveParent']) {
        return 'A categoria pai precisa estar ATIVA para que esta categoria possa ser ativada.';
      }
    }
    return null;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.categoryForm.get(fieldName);
    return !!(field?.invalid && field.touched);
  }
}


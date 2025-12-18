import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ProductService } from '../../../services/product.service';
import { CategoryService } from '../../../services/category.service';
import { Product, ProductStatus } from '../../../models/product.model';
import { Category } from '../../../models/category.model';
import { IconComponent } from '../../../shared/icons/icon.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss'
})
export class ProductListComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly router = inject(Router);

  products = signal<Product[]>([]);
  filteredProducts = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  // Filtros
  selectedCategoryId = signal<number | null>(null);
  selectedStatus = signal<ProductStatus | null>(null);
  searchTerm = signal('');

  // Mapa para buscar nome da categoria rapidamente
  categoryMap = signal<Map<number, string>>(new Map());

  // Computed para produtos filtrados
  displayedProducts = computed(() => {
    let filtered = this.products();

    if (this.selectedCategoryId()) {
      filtered = filtered.filter(p => p.categoriaId === this.selectedCategoryId()!);
    }

    if (this.selectedStatus()) {
      filtered = filtered.filter(p => p.status === this.selectedStatus()!);
    }

    if (this.searchTerm().trim()) {
      const term = this.searchTerm().toLowerCase();
      filtered = filtered.filter(
        p =>
          p.nome.toLowerCase().includes(term) ||
          p.sku.toLowerCase().includes(term) ||
          p.codigoBarras.includes(term)
      );
    }

    return filtered;
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      products: this.productService.getProducts(),
      categories: this.categoryService.getCategories() // ✅ CORRIGIDO: Usar getCategories() para incluir TODAS as categorias (ativas e inativas)
    }).subscribe({
      next: ({ products, categories }) => {
        console.log('Produtos carregados:', products);
        console.log('Categorias carregadas:', categories);
        this.products.set(products);
        this.categories.set(categories);
        this.buildCategoryMap(categories); // Agora inclui todas as categorias
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar dados:', err);
        this.error.set('Erro ao carregar produtos. Tente novamente.');
        this.loading.set(false);
      }
    });
  }

  private buildCategoryMap(categories: Category[]): void {
    const map = new Map<number, string>();
    categories.forEach(cat => {
      // Garante que o ID seja tratado como número
      const id = typeof cat.id === 'string' ? Number(cat.id) : cat.id;
      map.set(id, cat.nome);
    });
    this.categoryMap.set(map);
    console.log('CategoryMap construído:', Array.from(map.entries()));
    console.log('Categorias recebidas:', categories.map(c => ({ id: c.id, nome: c.nome, idType: typeof c.id })));
  }

  getCategoryName(categoriaId: number | string | undefined): string {
    if (categoriaId === undefined || categoriaId === null) {
      console.warn('categoriaId é undefined ou null');
      return 'N/A';
    }
    
    // Garante que categoriaId seja tratado como número para comparação
    const id = typeof categoriaId === 'string' ? Number(categoriaId) : categoriaId;
    const categoryName = this.categoryMap().get(id);
    
    if (!categoryName) {
      console.warn(`Categoria não encontrada para ID: ${categoriaId} (tipo: ${typeof categoriaId}, convertido: ${id})`);
      console.warn('Map atual:', Array.from(this.categoryMap().entries()));
      console.warn('Produtos:', this.products().map(p => ({ id: p.id, nome: p.nome, categoriaId: p.categoriaId, categoriaIdType: typeof p.categoriaId })));
    }
    
    return categoryName || 'N/A';
  }

  getTotalStock(product: Product): number {
    return this.productService.calculateTotalStock(product.estoquePorLoja);
  }

  getStatusClass(status: string): string {
    return status === 'ATIVO' ? 'status-active' : 'status-inactive';
  }

  getStatusLabel(status: string): string {
    return status === 'ATIVO' ? 'Ativo' : 'Inativo';
  }

  editProduct(id: number): void {
    this.router.navigate(['/produtos', id, 'editar']);
  }

  deleteProduct(product: Product): void {
    // Confirmação simples antes de deletar
    const confirmMessage = `Tem certeza que deseja remover o produto "${product.nome}"?\n\nEsta ação não pode ser desfeita.`;
    
    if (confirm(confirmMessage)) {
      this.loading.set(true);
      this.error.set(null);
      
      this.productService.deleteProduct(product.id).subscribe({
        next: () => {
          console.log('✅ Produto removido com sucesso');
          // Remove o produto da lista localmente para atualização imediata
          this.products.update(products => products.filter(p => p.id !== product.id));
          this.loading.set(false);
        },
        error: (err) => {
          console.error('❌ Erro ao remover produto:', err);
          
          // Extrai mensagem de erro do backend
          let errorMessage = 'Erro ao remover produto. Tente novamente.';
          if (err.error) {
            if (err.error.message) {
              errorMessage = err.error.message;
            } else if (typeof err.error === 'string') {
              errorMessage = err.error;
            }
          } else if (err.message) {
            errorMessage = err.message;
          }
          
          this.error.set(errorMessage);
          this.loading.set(false);
          
          // Remove o erro após 5 segundos
          setTimeout(() => {
            this.error.set(null);
          }, 5000);
        }
      });
    }
  }

  onCategoryFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedCategoryId.set(select.value ? +select.value : null);
  }

  onStatusFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedStatus.set(select.value as ProductStatus | null);
  }

  onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  clearFilters(): void {
    this.selectedCategoryId.set(null);
    this.selectedStatus.set(null);
    this.searchTerm.set('');
  }

  hasActiveFilters(): boolean {
    return !!(this.selectedCategoryId() || this.selectedStatus() || this.searchTerm().trim());
  }
}


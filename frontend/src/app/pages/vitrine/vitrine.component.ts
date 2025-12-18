import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { Product } from '../../models/product.model';
import { Category } from '../../models/category.model';
import { IconComponent } from '../../shared/icons/icon.component';
import { forkJoin } from 'rxjs';

// Função helper para garantir URL absoluta do backend
function getImageUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  if (url.startsWith('/')) {
    return `http://localhost:3000${url}`;
  }
  return `http://localhost:3000/uploads/produtos/${url}`;
}

@Component({
  selector: 'app-vitrine',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './vitrine.component.html',
  styleUrl: './vitrine.component.scss'
})
export class VitrineComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly router = inject(Router);

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  // Filtros
  selectedCategoryId = signal<number | null>(null);
  searchTerm = signal('');

  // Mapa para buscar nome da categoria
  categoryMap = signal<Map<number, string>>(new Map());

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      products: this.productService.getProducts(),
      categories: this.categoryService.getCategories()
    }).subscribe({
      next: ({ products, categories }) => {
        // Filtra apenas produtos ativos
        const activeProducts = products.filter(p => p.status === 'ATIVO');
        this.products.set(activeProducts);
        this.categories.set(categories);
        this.buildCategoryMap(categories);
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
      const id = typeof cat.id === 'string' ? Number(cat.id) : cat.id;
      map.set(id, cat.nome);
    });
    this.categoryMap.set(map);
  }

  getCategoryName(categoriaId: number | string | undefined): string {
    if (categoriaId === undefined || categoriaId === null) {
      return 'N/A';
    }
    const id = typeof categoriaId === 'string' ? Number(categoriaId) : categoriaId;
    return this.categoryMap().get(id) || 'N/A';
  }

  getImageUrl(url: string): string {
    return getImageUrl(url);
  }

  getFirstImage(product: Product): string | null {
    if (product.imagens && product.imagens.length > 0) {
      return this.getImageUrl(product.imagens[0]);
    }
    return null;
  }

  formatPrice(price: number): string {
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
  }

  onCategoryFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedCategoryId.set(select.value ? +select.value : null);
  }

  onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  clearFilters(): void {
    this.selectedCategoryId.set(null);
    this.searchTerm.set('');
  }

  hasActiveFilters(): boolean {
    return !!(this.selectedCategoryId() || this.searchTerm().trim());
  }

  get filteredProducts(): Product[] {
    let filtered = this.products();

    if (this.selectedCategoryId()) {
      filtered = filtered.filter(p => p.categoriaId === this.selectedCategoryId()!);
    }

    if (this.searchTerm().trim()) {
      const term = this.searchTerm().toLowerCase();
      filtered = filtered.filter(
        p =>
          p.nome.toLowerCase().includes(term) ||
          p.descricao.toLowerCase().includes(term)
      );
    }

    return filtered;
  }

  viewProductDetails(id: number): void {
    this.router.navigate(['/produtos', id, 'detalhes']);
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}



import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../../services/product.service';
import { CategoryService } from '../../../services/category.service';
import { StoreService } from '../../../services/store.service';
import { Product } from '../../../models/product.model';
import { Category } from '../../../models/category.model';
import { Store } from '../../../models/store.model';
import { IconComponent } from '../../../shared/icons/icon.component';

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
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss'
})
export class ProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly storeService = inject(StoreService);

  product = signal<Product | null>(null);
  category = signal<Category | null>(null);
  stores = signal<Store[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    const productId = this.route.snapshot.paramMap.get('id');
    if (productId) {
      this.loadProduct(Number(productId));
    } else {
      this.error.set('ID do produto não fornecido');
      this.loading.set(false);
    }
  }

  loadProduct(id: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.productService.getProductById(id).subscribe({
      next: (product) => {
        this.product.set(product);
        this.loadCategory(product.categoriaId);
        this.loadStores(product.estoquePorLoja.map(e => e.lojaId));
      },
      error: (err) => {
        console.error('Erro ao carregar produto:', err);
        this.error.set('Erro ao carregar os detalhes do produto');
        this.loading.set(false);
      }
    });
  }

  loadCategory(categoriaId: number): void {
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        const category = categories.find(c => c.id === categoriaId);
        this.category.set(category || null);
      },
      error: (err) => {
        console.error('Erro ao carregar categoria:', err);
      }
    });
  }

  loadStores(lojaIds: number[]): void {
    this.storeService.getStores().subscribe({
      next: (stores) => {
        const filteredStores = stores.filter(s => lojaIds.includes(s.id));
        this.stores.set(filteredStores);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar lojas:', err);
        this.loading.set(false);
      }
    });
  }

  getStoreName(lojaId: number): string {
    const store = this.stores().find(s => s.id === lojaId);
    return store?.nome || `Loja #${lojaId}`;
  }

  getTotalStock(): number {
    const product = this.product();
    if (!product) return 0;
    return this.productService.calculateTotalStock(product.estoquePorLoja);
  }

  getDiscountPercent(): number | null {
    const product = this.product();
    if (!product) return null;
    return this.productService.calculateDiscountPercent(product.preco, product.precoPromocional);
  }

  formatPrice(price: number): string {
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  editProduct(): void {
    const product = this.product();
    if (product) {
      this.router.navigate(['/produtos', product.id, 'editar']);
    }
  }

  // Getter para garantir URLs absolutas ao exibir
  getImagemUrl(url: string): string {
    return getImageUrl(url);
  }
}



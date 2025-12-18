import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { ProductService } from '../../../services/product.service';
import { Product, ProductStatus } from '../../../models/product.model';
import { ProductListComponent } from '../product-list/product-list.component';
import { ProductFormComponent } from '../product-form/product-form.component';
import { ProductDeactivateModalComponent } from '../product-deactivate-modal/product-deactivate-modal.component';
import { ProductDeleteModalComponent } from '../product-delete-modal/product-delete-modal.component';
import { IconComponent } from '../../../shared/icons/icon.component';

@Component({
  selector: 'app-products-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    ProductListComponent,
    ProductDeactivateModalComponent,
    ProductDeleteModalComponent,
    IconComponent
  ],
  templateUrl: './products-page.component.html',
  styleUrl: './products-page.component.scss'
})
export class ProductsPageComponent implements OnInit, OnDestroy {
  protected readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);

  currentView = signal<'list' | 'form' | 'deactivate' | 'delete'>('list');
  selectedProduct = signal<Product | null>(null);
  deactivateModalOpen = signal(false);
  deleteModalOpen = signal(false);
  private routerSubscription?: Subscription;

  ngOnInit(): void {
    this.checkCurrentRoute();

    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.checkCurrentRoute();
      });
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }

  private checkCurrentRoute(): void {
    const url = this.router.url;

    if (url.includes('/produtos/nova')) {
      this.currentView.set('form');
    } else if (url.includes('/editar')) {
      this.currentView.set('form');
    } else if (url.includes('/inativar')) {
      this.loadProductForAction('deactivate');
    } else if (url.includes('/remover')) {
      this.loadProductForAction('delete');
    } else if (url === '/produtos' || (url.startsWith('/produtos/') && !url.includes('/nova') && !url.includes('/editar'))) {
      this.currentView.set('list');
    }
  }

  private loadProductForAction(action: 'deactivate' | 'delete'): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.productService.getProductById(+id).subscribe({
        next: (product) => {
          this.selectedProduct.set(product);
          if (action === 'deactivate') {
            this.deactivateModalOpen.set(true);
            this.currentView.set('deactivate');
          } else {
            this.deleteModalOpen.set(true);
            this.currentView.set('delete');
          }
        },
        error: (err) => {
          console.error('Erro ao carregar produto:', err);
          this.router.navigate(['/produtos']);
        }
      });
    }
  }

  onCreateNew(): void {
    this.router.navigate(['/produtos', 'nova']);
  }

  onDeactivateConfirm(): void {
    const product = this.selectedProduct();
    if (!product) return;

    const newStatus: ProductStatus = product.status === 'ATIVO' ? 'INATIVO' : 'ATIVO';

    this.productService.updateProduct(product.id, {
      nome: product.nome,
      descricao: product.descricao,
      categoriaId: product.categoriaId,
      preco: product.preco,
      precoPromocional: product.precoPromocional,
      sku: product.sku,
      codigoBarras: product.codigoBarras,
      tamanhos: product.tamanhos,
      cores: product.cores,
      estoquePorLoja: product.estoquePorLoja,
      imagens: product.imagens,
      status: newStatus
    }).subscribe({
      next: () => {
        this.closeModals();
        this.router.navigate(['/produtos']);
      },
      error: (err) => {
        console.error('Erro ao alterar status do produto:', err);
      }
    });
  }

  onDeleteConfirm(): void {
    const product = this.selectedProduct();
    if (!product) return;

    this.productService.deleteProduct(product.id).subscribe({
      next: () => {
        this.closeModals();
        this.router.navigate(['/produtos']);
      },
      error: (err) => {
        console.error('Erro ao remover produto:', err);
      }
    });
  }

  closeModals(): void {
    this.deactivateModalOpen.set(false);
    this.deleteModalOpen.set(false);
    this.selectedProduct.set(null);
  }
}








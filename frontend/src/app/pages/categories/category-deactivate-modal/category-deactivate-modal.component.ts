import { Component, Input, Output, EventEmitter, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CategoryService } from '../../../services/category.service';
import { Category } from '../../../models/category.model';
import { Product } from '../../../models/product.model';
import { IconComponent } from '../../../shared/icons/icon.component';

type DeactivateAction = 'remove' | 'relocate';

@Component({
  selector: 'app-category-deactivate-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent],
  templateUrl: './category-deactivate-modal.component.html',
  styleUrl: './category-deactivate-modal.component.scss'
})
export class CategoryDeactivateModalComponent implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly fb = inject(FormBuilder);

  @Input({ required: true }) category!: Category;
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<{ action: DeactivateAction; targetCategoryId?: number }>();

  products = signal<Product[]>([]);
  productsFromChildren = signal<Product[]>([]);
  totalProducts = signal(0);
  loading = signal(false);
  relocateForm!: FormGroup;
  availableCategories = signal<Category[]>([]);
  hasChildCategories = signal(false);

  ngOnInit(): void {
    this.initRelocateForm();
    this.loadProducts();
  }

  private initRelocateForm(): void {
    this.relocateForm = this.fb.group({
      targetCategoryId: [null, Validators.required]
    });
  }

  private loadProducts(): void {
    this.loading.set(true);
    this.categoryService.getProductsWithChildren(this.category.id).subscribe({
      next: (data) => {
        this.products.set(data.produtosCategoria);
        this.productsFromChildren.set(data.produtosFilhas);
        this.totalProducts.set(data.totalProdutos);
        this.hasChildCategories.set(data.categoriasFilhasIds.length > 0);
        this.loading.set(false);
        
        // Após carregar produtos, carregar categorias disponíveis excluindo a atual e filhas
        this.loadAvailableCategories(data.categoriasFilhasIds);
      },
      error: (err) => {
        console.error('Erro ao carregar produtos:', err);
        // Fallback para método antigo se o novo endpoint não existir
        this.categoryService.getProductsByCategory(this.category.id).subscribe({
          next: (produtos) => {
            this.products.set(produtos);
            this.totalProducts.set(produtos.length);
            this.loading.set(false);
            // Fallback: apenas excluir a categoria atual
            this.loadAvailableCategories([]);
          },
          error: (fallbackErr) => {
            console.error('Erro ao carregar produtos (fallback):', fallbackErr);
            this.loading.set(false);
            this.loadAvailableCategories([]);
          }
        });
      }
    });
  }

  private loadAvailableCategories(childCategoryIds: number[] = []): void {
    // Excluir a categoria atual e todas as categorias filhas da lista de disponíveis
    const excludeIds = [this.category.id, ...childCategoryIds];
    this.categoryService.getActiveCategories(undefined, excludeIds).subscribe({
      next: (categories) => {
        this.availableCategories.set(categories);
      },
      error: (err) => {
        console.error('Erro ao carregar categorias:', err);
        // Fallback: apenas excluir a categoria atual
        this.categoryService.getActiveCategories(this.category.id).subscribe({
          next: (categories) => {
            this.availableCategories.set(categories);
          },
          error: (fallbackErr) => {
            console.error('Erro ao carregar categorias (fallback):', fallbackErr);
          }
        });
      }
    });
  }

  onClose(): void {
    this.close.emit();
  }

  onConfirm(): void {
    if (this.hasProducts) {
      // Se tem produtos, realocação é obrigatória
      if (this.relocateForm.invalid) {
        this.relocateForm.markAllAsTouched();
        return;
      }
      this.confirm.emit({
        action: 'relocate',
        targetCategoryId: this.relocateForm.value.targetCategoryId
      });
    } else {
      // Se não tem produtos, pode inativar diretamente
      this.confirm.emit({ action: 'remove' });
    }
  }

  get hasProducts(): boolean {
    return this.totalProducts() > 0;
  }
}


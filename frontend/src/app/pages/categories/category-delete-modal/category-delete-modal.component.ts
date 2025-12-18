import { Component, Input, Output, EventEmitter, signal, inject, OnChanges, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CategoryService } from '../../../services/category.service';
import { Category } from '../../../models/category.model';
import { Product } from '../../../models/product.model';
import { IconComponent } from '../../../shared/icons/icon.component';

@Component({
  selector: 'app-category-delete-modal',
  standalone: true,
  imports: [CommonModule, IconComponent, ReactiveFormsModule],
  templateUrl: './category-delete-modal.component.html',
  styleUrl: './category-delete-modal.component.scss'
})
export class CategoryDeleteModalComponent implements OnChanges, OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly fb = inject(FormBuilder);

  @Input({ required: true }) category!: Category;
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<{ targetCategoryId?: number }>();

  products = signal<Product[]>([]);
  productsFromChildren = signal<Product[]>([]);
  totalProducts = signal(0);
  loading = signal(false);
  relocateForm!: FormGroup;
  availableCategories = signal<Category[]>([]);
  hasChildCategories = signal(false);

  ngOnInit(): void {
    this.initRelocateForm();
  }

  ngOnChanges(): void {
    if (this.isOpen && this.category) {
      this.loadProducts();
    }
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
    if (this.hasProducts || this.hasChildCategories()) {
      // Se tem produtos ou categorias filhas, deve usar removeWithRelocation
      // Quando não há produtos, targetCategoryId será opcional no backend
      if (this.hasProducts) {
        // Se tem produtos, realocação é obrigatória
        if (this.relocateForm.invalid) {
          this.relocateForm.markAllAsTouched();
          return;
        }
        // Envia com targetCategoryId quando há produtos
        this.confirm.emit({
          targetCategoryId: this.relocateForm.value.targetCategoryId
        });
      } else {
        // Se não tem produtos mas tem categorias filhas, emite sem targetCategoryId
        // O objeto vazio indica que deve usar removeWithRelocation mas sem realocação
        this.confirm.emit({});
      }
    } else {
      // Se não tem produtos nem categorias filhas, pode deletar diretamente
      this.confirm.emit();
    }
  }

  get hasProducts(): boolean {
    return this.totalProducts() > 0;
  }
}


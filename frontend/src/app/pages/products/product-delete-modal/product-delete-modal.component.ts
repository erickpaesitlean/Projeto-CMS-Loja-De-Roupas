import { Component, Input, Output, EventEmitter, signal, inject, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../../services/product.service';
import { Product } from '../../../models/product.model';
import { IconComponent } from '../../../shared/icons/icon.component';

@Component({
  selector: 'app-product-delete-modal',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './product-delete-modal.component.html',
  styleUrl: './product-delete-modal.component.scss'
})
export class ProductDeleteModalComponent implements OnChanges {
  private readonly productService = inject(ProductService);

  @Input({ required: true }) product!: Product;
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();

  loading = signal(false);
  canDelete = signal<boolean | null>(null);
  deleteReason = signal<string | undefined>(undefined);

  ngOnChanges(): void {
    if (this.isOpen && this.product) {
      this.checkCanDelete();
    }
  }

  private checkCanDelete(): void {
    this.loading.set(true);
    this.productService.canDeleteProduct(this.product.id).subscribe({
      next: (result) => {
        this.canDelete.set(result.canDelete);
        this.deleteReason.set(result.reason);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erro ao verificar se pode remover:', err);
        this.loading.set(false);
      }
    });
  }

  onClose(): void {
    this.close.emit();
  }

  onConfirm(): void {
    if (this.canDelete()) {
      this.confirm.emit();
    }
  }
}


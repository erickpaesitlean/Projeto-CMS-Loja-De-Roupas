import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../../services/product.service';
import { Product } from '../../../models/product.model';
import { IconComponent } from '../../../shared/icons/icon.component';

@Component({
  selector: 'app-product-deactivate-modal',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './product-deactivate-modal.component.html',
  styleUrl: './product-deactivate-modal.component.scss'
})
export class ProductDeactivateModalComponent {
  private readonly productService = inject(ProductService);

  @Input({ required: true }) product!: Product;
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();

  onClose(): void {
    this.close.emit();
  }

  onConfirm(): void {
    this.confirm.emit();
  }

  getNewStatus(): string {
    return this.product.status === 'ATIVO' ? 'INATIVO' : 'ATIVO';
  }
}








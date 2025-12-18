import { Component, Input, Output, EventEmitter, signal, inject, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreService } from '../../../services/store.service';
import { Store } from '../../../models/store.model';
import { Product } from '../../../models/product.model';
import { IconComponent } from '../../../shared/icons/icon.component';

@Component({
  selector: 'app-store-delete-modal',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './store-delete-modal.component.html',
  styleUrl: './store-delete-modal.component.scss'
})
export class StoreDeleteModalComponent implements OnChanges {
  private readonly storeService = inject(StoreService);

  @Input({ required: true }) store!: Store;
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();

  products = signal<Product[]>([]);
  loading = signal(false);
  totalStock = signal(0);

  ngOnChanges(): void {
    if (this.isOpen && this.store) {
      this.loadStoreData();
    }
  }

  private loadStoreData(): void {
    this.loading.set(true);
    
    this.storeService.getProductsInStore(this.store.id).subscribe({
      next: (produtos) => {
        this.products.set(produtos);
        this.calculateTotalStock();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar dados da loja:', err);
        this.loading.set(false);
      }
    });
  }

  private calculateTotalStock(): void {
    this.storeService.calculateTotalStock(this.store.id).subscribe({
      next: (total) => {
        this.totalStock.set(total);
      },
      error: (err) => {
        console.error('Erro ao calcular estoque:', err);
      }
    });
  }

  onClose(): void {
    this.close.emit();
  }

  onConfirm(): void {
    console.log('Confirmando exclusão da loja:', this.store.id);
    this.confirm.emit();
  }

  get hasProducts(): boolean {
    return this.products().length > 0;
  }
}







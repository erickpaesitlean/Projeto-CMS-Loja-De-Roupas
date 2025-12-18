import { Component, OnInit, signal, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { StoreService } from '../../../services/store.service';
import { Store } from '../../../models/store.model';
import { IconComponent } from '../../../shared/icons/icon.component';

@Component({
  selector: 'app-store-list',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './store-list.component.html',
  styleUrl: './store-list.component.scss'
})
export class StoreListComponent implements OnInit {
  private readonly storeService = inject(StoreService);
  private readonly router = inject(Router);

  @Output() deleteStoreRequest = new EventEmitter<number>();

  stores = signal<Store[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadStores();
  }

  loadStores(): void {
    this.loading.set(true);
    this.error.set(null);

    this.storeService.getStores().subscribe({
      next: (stores) => {
        this.stores.set(stores);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar lojas:', err);
        this.error.set('Erro ao carregar lojas. Tente novamente.');
        this.loading.set(false);
      }
    });
  }

  editStore(id: number): void {
    this.router.navigate(['/lojas', id, 'editar']);
  }

  deleteStore(id: number): void {
    console.log('Botão de excluir clicado para loja:', id);
    // Emite evento para o componente pai abrir o modal
    this.deleteStoreRequest.emit(id);
    console.log('Evento deleteStoreRequest emitido');
  }

  getStatusClass(status: string): string {
    return status === 'ATIVA' ? 'status-active' : 'status-inactive';
  }

  getStatusLabel(status: string): string {
    return status === 'ATIVA' ? 'Ativa' : 'Inativa';
  }

  getTypeLabel(tipo: string): string {
    return tipo === 'FISICA' ? 'Física' : 'Online';
  }

  getLocationLabel(store: Store): string {
    if (store.tipo === 'ONLINE') {
      return 'Online';
    }
    if (store.endereco) {
      return `${store.endereco.cidade}, ${store.endereco.estado}`;
    }
    return '-';
  }
}







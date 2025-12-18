import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { StoreService } from '../../../services/store.service';
import { Store } from '../../../models/store.model';
import { StoreListComponent } from '../store-list/store-list.component';
import { StoreDeactivateModalComponent } from '../store-deactivate-modal/store-deactivate-modal.component';
import { StoreDeleteModalComponent } from '../store-delete-modal/store-delete-modal.component';
import { IconComponent } from '../../../shared/icons/icon.component';

@Component({
  selector: 'app-stores-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    StoreListComponent,
    StoreDeactivateModalComponent,
    StoreDeleteModalComponent,
    IconComponent
  ],
  templateUrl: './stores-page.component.html',
  styleUrl: './stores-page.component.scss'
})
export class StoresPageComponent implements OnInit, OnDestroy {
  protected readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly storeService = inject(StoreService);

  currentView = signal<'list' | 'form' | 'deactivate' | 'delete'>('list');
  selectedStore = signal<Store | null>(null);
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

    if (url.includes('/lojas/nova')) {
      this.currentView.set('form');
    } else if (url.includes('/editar')) {
      this.currentView.set('form');
    } else if (url.includes('/inativar')) {
      this.loadStoreForAction('deactivate');
    } else if (url.includes('/remover')) {
      this.loadStoreForAction('delete');
    } else {
      this.currentView.set('list');
    }
  }

  private loadStoreForAction(action: 'deactivate' | 'delete'): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.storeService.getStoreById(+id).subscribe({
        next: (store) => {
          this.selectedStore.set(store);
          if (action === 'deactivate') {
            this.deactivateModalOpen.set(true);
            this.currentView.set('deactivate');
          } else {
            this.deleteModalOpen.set(true);
            this.currentView.set('delete');
          }
        },
        error: (err) => {
          console.error('Erro ao carregar loja:', err);
          this.router.navigate(['/lojas']);
        }
      });
    }
  }

  onCreateNew(): void {
    this.router.navigate(['/lojas', 'nova']);
  }

  onDeactivateConfirm(): void {
    const store = this.selectedStore();
    if (!store) return;

    const newStatus = store.status === 'ATIVA' ? 'INATIVA' : 'ATIVA';

    this.storeService.updateStore(store.id, { ...store, status: newStatus }).subscribe({
      next: () => {
        this.closeModals();
        this.router.navigate(['/lojas']);
      },
      error: (err) => {
        console.error('Erro ao inativar/ativar loja:', err);
      }
    });
  }

  onDeleteConfirm(): void {
    const store = this.selectedStore();
    if (!store) return;

    console.log('Confirmando exclusão da loja:', store.id);

    this.storeService.deleteStore(store.id).subscribe({
      next: () => {
        console.log('Loja removida com sucesso');
        this.closeModals();
        this.router.navigate(['/lojas']).then(() => {
          // Recarregar a página para atualizar a lista
          window.location.reload();
        });
      },
      error: (err) => {
        console.error('Erro ao remover loja:', err);
        console.error('Detalhes do erro:', {
          status: err.status,
          statusText: err.statusText,
          message: err.message,
          error: err.error,
          url: err.url
        });
        alert(err.error?.message || 'Erro ao remover loja. Tente novamente.');
      }
    });
  }

  closeModals(): void {
    this.deactivateModalOpen.set(false);
    this.deleteModalOpen.set(false);
    this.selectedStore.set(null);
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  onDeleteStoreRequest(id: number): void {
    console.log('Solicitação de exclusão recebida para loja:', id);
    this.storeService.getStoreById(id).subscribe({
      next: (store) => {
        console.log('Loja carregada para exclusão:', store);
        this.selectedStore.set(store);
        this.deleteModalOpen.set(true);
      },
      error: (err) => {
        console.error('Erro ao carregar loja:', err);
        alert('Erro ao carregar loja. Tente novamente.');
      }
    });
  }
}







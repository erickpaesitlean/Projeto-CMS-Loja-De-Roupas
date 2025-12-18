import { Component, OnInit, OnDestroy, signal, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { CategoryService } from '../../../services/category.service';
import { Category } from '../../../models/category.model';
import { CategoryListComponent } from '../category-list/category-list.component';
import { CategoryDeactivateModalComponent } from '../category-deactivate-modal/category-deactivate-modal.component';
import { CategoryDeleteModalComponent } from '../category-delete-modal/category-delete-modal.component';
import { IconComponent } from '../../../shared/icons/icon.component';

@Component({
  selector: 'app-categories-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    CategoryListComponent,
    CategoryDeactivateModalComponent,
    CategoryDeleteModalComponent,
    IconComponent
  ],
  templateUrl: './categories-page.component.html',
  styleUrl: './categories-page.component.scss'
})
export class CategoriesPageComponent implements OnInit, OnDestroy {
  protected readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly categoryService = inject(CategoryService);

  @ViewChild(CategoryListComponent) categoryListComponent?: CategoryListComponent;

  currentView = signal<'list' | 'form' | 'deactivate' | 'delete'>('list');
  selectedCategory = signal<Category | null>(null);
  deactivateModalOpen = signal(false);
  deleteModalOpen = signal(false);
  private routerSubscription?: Subscription;

  ngOnInit(): void {
    // Verifica a rota atual para determinar a view
    this.checkCurrentRoute();
    
    // Escuta mudanças de navegação
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
    
    // Verifica rotas específicas primeiro
    if (url.includes('/inativar')) {
      this.loadCategoryForAction('deactivate');
      return;
    }
    
    if (url.includes('/remover')) {
      this.loadCategoryForAction('delete');
      return;
    }
    
    if (url.includes('/categorias/nova') || url.includes('/editar')) {
      this.currentView.set('form');
      return;
    }
    
    // Se chegou aqui, deve ser a listagem
    if (url === '/categorias' || url.startsWith('/categorias')) {
      this.currentView.set('list');
    }
  }

  private loadCategoryForAction(action: 'deactivate' | 'delete'): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.categoryService.getCategoryById(+id).subscribe({
        next: (category) => {
          this.selectedCategory.set(category);
          if (action === 'deactivate') {
            this.deactivateModalOpen.set(true);
            this.currentView.set('deactivate');
          } else {
            this.deleteModalOpen.set(true);
            this.currentView.set('delete');
          }
        },
        error: (err) => {
          console.error('Erro ao carregar categoria:', err);
          this.router.navigate(['/categorias']);
        }
      });
    }
  }

  onCreateNew(): void {
    this.router.navigate(['/categorias', 'nova']);
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  onDeactivateConfirm(data: { action: 'remove' | 'relocate'; targetCategoryId?: number }): void {
    const category = this.selectedCategory();
    if (!category) return;

    // Se categoria está ativa, verificar se precisa realocar produtos
    if (category.status === 'ATIVA') {
      if (data.action === 'relocate' && data.targetCategoryId) {
        // Inativar com realocação
        this.categoryService.deactivateCategoryWithRelocation(category.id, data.targetCategoryId).subscribe({
          next: () => {
            this.closeModals();
            this.router.navigate(['/categorias']);
            // Recarrega a lista de categorias
            this.reloadCategoryList();
          },
          error: (err) => {
            console.error('Erro ao inativar categoria com realocação:', err);
            alert(err.error?.message || 'Erro ao inativar categoria. Tente novamente.');
          }
        });
      } else {
        // Inativar sem produtos (ou sem realocação se não tiver produtos)
        this.categoryService.deactivateCategoryWithCascade(category.id).subscribe({
          next: () => {
            this.closeModals();
            this.router.navigate(['/categorias']);
            // Recarrega a lista de categorias
            this.reloadCategoryList();
          },
          error: (err) => {
            console.error('Erro ao inativar categoria:', err);
            alert(err.error?.message || 'Erro ao inativar categoria. Tente novamente.');
          }
        });
      }
    } 
    // Se está inativa, ativar (sem cascata)
    else {
      this.categoryService.updateCategory(category.id, {
        nome: category.nome,
        descricao: category.descricao,
        slug: category.slug,
        categoriaPaiId: category.categoriaPaiId,
        status: 'ATIVA'
      }).subscribe({
        next: () => {
          this.closeModals();
          this.router.navigate(['/categorias']);
          // Recarrega a lista de categorias
          this.reloadCategoryList();
        },
        error: (err) => {
          console.error('Erro ao ativar categoria:', err);
          alert(err.error?.message || 'Erro ao ativar categoria. Tente novamente.');
        }
      });
    }
  }

  onDeleteConfirm(data?: { targetCategoryId?: number }): void {
    const category = this.selectedCategory();
    if (!category) return;

    // Se data está presente (mesmo que seja objeto vazio), significa que deve usar removeWithRelocation
    // Isso acontece quando há categorias filhas (com ou sem produtos)
    // Se data.targetCategoryId existe, há produtos para realocar
    // Se data existe mas targetCategoryId não existe, não há produtos mas há categorias filhas
    if (data !== undefined) {
      // Deletar com removeWithRelocation (com ou sem realocação de produtos)
      const targetCategoryId = data.targetCategoryId;
      this.categoryService.deleteCategoryWithRelocation(category.id, targetCategoryId).subscribe({
        next: () => {
          this.closeModals();
          this.router.navigate(['/categorias']);
          // Recarrega a lista de categorias
          this.reloadCategoryList();
        },
        error: (err) => {
          console.error('Erro ao remover categoria com realocação:', err);
          alert(err.error?.message || 'Erro ao remover categoria. Tente novamente.');
        }
      });
    } else {
      // Deletar sem produtos e sem categorias filhas - usar método simples
      this.categoryService.deleteCategory(category.id).subscribe({
        next: () => {
          this.closeModals();
          this.router.navigate(['/categorias']);
          // Recarrega a lista de categorias
          this.reloadCategoryList();
        },
        error: (err) => {
          console.error('Erro ao remover categoria:', err);
          alert(err.error?.message || 'Erro ao remover categoria. Tente novamente.');
        }
      });
    }
  }

  closeModals(): void {
    this.deactivateModalOpen.set(false);
    this.deleteModalOpen.set(false);
    this.selectedCategory.set(null);
  }

  onDeleteCategoryRequest(id: number): void {
    this.categoryService.getCategoryById(id).subscribe({
      next: (category) => {
        this.selectedCategory.set(category);
        this.deleteModalOpen.set(true);
      },
      error: (err) => {
        console.error('Erro ao carregar categoria:', err);
        alert('Erro ao carregar categoria. Tente novamente.');
      }
    });
  }

  private reloadCategoryList(): void {
    // Aguarda um delay para garantir que a navegação foi concluída e o componente foi renderizado
    setTimeout(() => {
      if (this.categoryListComponent) {
        this.categoryListComponent.loadCategories();
      } else {
        // Se o componente ainda não estiver disponível, tenta novamente após mais um delay
        setTimeout(() => {
          if (this.categoryListComponent) {
            this.categoryListComponent.loadCategories();
          }
        }, 200);
      }
    }, 300);
  }
}


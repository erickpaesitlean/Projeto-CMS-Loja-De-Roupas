import { Component, OnInit, signal, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CategoryService } from '../../../services/category.service';
import { Category } from '../../../models/category.model';
import { IconComponent } from '../../../shared/icons/icon.component';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './category-list.component.html',
  styleUrl: './category-list.component.scss'
})
export class CategoryListComponent implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly router = inject(Router);

  @Output() deleteCategoryRequest = new EventEmitter<number>();

  categories = signal<Category[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  // Mapa para buscar nome da categoria pai rapidamente
  categoryMap = signal<Map<number, string>>(new Map());

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading.set(true);
    this.error.set(null);

    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        console.log('Categorias carregadas:', categories);
        this.categories.set(categories);
        this.buildCategoryMap(categories);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar categorias:', err);
        console.error('Detalhes do erro:', {
          message: err.message,
          status: err.status,
          statusText: err.statusText,
          url: err.url
        });
        this.error.set(`Erro ao carregar categorias: ${err.message || 'Servidor não disponível. Verifique se o json-server está rodando.'}`);
        this.loading.set(false);
      }
    });
  }

  private buildCategoryMap(categories: Category[]): void {
    const map = new Map<number, string>();
    categories.forEach(cat => {
      map.set(cat.id, cat.nome);
    });
    this.categoryMap.set(map);
  }

  getCategoryParentName(categoriaPaiId: number | null): string {
    if (!categoriaPaiId) return '-';
    return this.categoryMap().get(categoriaPaiId) || '-';
  }

  editCategory(category: Category): void {
    this.router.navigate(['/categorias', category.slug, 'editar']);
  }

  deleteCategory(id: number): void {
    // Emite evento para o componente pai abrir o modal
    this.deleteCategoryRequest.emit(id);
  }

  getStatusClass(status: string): string {
    return status === 'ATIVA' ? 'status-active' : 'status-inactive';
  }

  getStatusLabel(status: string): string {
    return status === 'ATIVA' ? 'Ativa' : 'Inativa';
  }
}


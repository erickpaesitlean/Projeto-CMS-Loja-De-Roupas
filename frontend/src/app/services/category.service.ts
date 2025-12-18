import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, forkJoin, switchMap, of, tap } from 'rxjs';
import { Category, CategoryFormData, CategoryStatus } from '../models/category.model';
import { Product } from '../models/product.model';
import { LogService } from './log.service';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly logService = inject(LogService);
  private readonly apiUrl = 'http://localhost:3000';

  /**
   * Busca todas as categorias
   */
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/categorias`);
  }

  /**
   * Busca uma categoria por ID (aceita number ou string)
   */
  getCategoryById(id: number | string): Observable<Category> {
    return this.http.get<Category>(`${this.apiUrl}/categorias/${id}`);
  }

  /**
   * Busca uma categoria por slug (URL amigável)
   */
  getCategoryBySlug(slug: string): Observable<Category> {
    return this.http.get<Category>(`${this.apiUrl}/categorias/by-slug/${encodeURIComponent(slug)}`);
  }

  /**
   * Cria uma nova categoria
   */
  createCategory(data: CategoryFormData): Observable<Category> {
    return this.http.post<Category>(`${this.apiUrl}/categorias`, data).pipe(
      tap(category => {
        this.logService.createLogSilent(
          'create',
          'Categoria',
          `Categoria "${category.nome}" foi criada`
        );
      })
    );
  }

  /**
   * Atualiza uma categoria existente (aceita ID como number ou string)
   */
  updateCategory(id: number | string, data: CategoryFormData): Observable<Category> {
    const url = `${this.apiUrl}/categorias/${id}`;
    console.log('[CategoryService] updateCategory chamado', { id, url, data });
    return this.http.put<Category>(url, data).pipe(
      tap(category => {
        console.log('[CategoryService] updateCategory sucesso', category);
        this.logService.createLogSilent(
          'update',
          'Categoria',
          `Categoria "${category.nome}" foi atualizada`
        );
      })
    );
  }

  /**
   * Remove uma categoria
   */
  deleteCategory(id: number): Observable<void> {
    return this.getCategoryById(id).pipe(
      switchMap(category => {
        return this.http.delete<void>(`${this.apiUrl}/categorias/${id}`).pipe(
          tap(() => {
            this.logService.createLogSilent(
              'delete',
              'Categoria',
              `Categoria "${category.nome}" foi removida`
            );
          })
        );
      })
    );
  }

  /**
   * Remove uma categoria com realocação de produtos (ou sem produtos, apenas excluindo categorias filhas)
   */
  deleteCategoryWithRelocation(categoryId: number, targetCategoryId?: number): Observable<any> {
    // Só envia targetCategoryId se for um número válido e maior que 0
    const body: any = {};
    if (targetCategoryId !== undefined && targetCategoryId !== null && !isNaN(targetCategoryId) && targetCategoryId > 0) {
      body.targetCategoryId = targetCategoryId;
    }
    // Se body está vazio, envia um objeto vazio mesmo (o backend trata como undefined)
    
    return this.http.post<any>(`${this.apiUrl}/categorias/${categoryId}/remove-with-relocation`, body).pipe(
      tap((result) => {
        const logMessage = result.produtosRealocados > 0 && result.categoriaDestino
          ? `Categoria foi removida e ${result.produtosRealocados} produto(s) foram realocados para "${result.categoriaDestino}"`
          : 'Categoria foi removida';
        this.logService.createLogSilent('delete', 'Categoria', logMessage);
      })
    );
  }

  /**
   * Busca produtos associados a uma categoria
   */
  getProductsByCategory(categoryId: number): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/produtos?categoriaId=${categoryId}`);
  }

  /**
   * Busca produtos de uma categoria e de todas suas categorias filhas
   */
  getProductsWithChildren(categoryId: number): Observable<{
    categoria: { id: number; nome: string };
    produtosCategoria: Array<Product & { origem: string }>;
    produtosFilhas: Array<Product & { origem: string }>;
    totalProdutos: number;
    categoriasFilhasIds: number[];
  }> {
    return this.http.get<{
      categoria: { id: number; nome: string };
      produtosCategoria: Array<Product & { origem: string }>;
      produtosFilhas: Array<Product & { origem: string }>;
      totalProdutos: number;
      categoriasFilhasIds: number[];
    }>(`${this.apiUrl}/categorias/${categoryId}/products-with-children`);
  }

  /**
   * Verifica se uma categoria possui produtos associados
   */
  hasProducts(categoryId: number): Observable<boolean> {
    return this.getProductsByCategory(categoryId).pipe(
      map(produtos => produtos.length > 0)
    );
  }

  /**
   * Busca categorias ativas para usar como categoria pai
   */
  getActiveCategories(excludeId?: number | string, excludeIds?: (number | string)[]): Observable<Category[]> {
    return this.getCategories().pipe(
      map(categorias => {
        const excludeList = excludeIds || [];
        if (excludeId) {
          excludeList.push(excludeId);
        }
        
        return categorias.filter(
          cat => {
            // Apenas categorias ativas
            if (cat.status !== 'ATIVA') return false;
            
            // Excluir IDs da lista
            const catIdStr = String(cat.id);
            return !excludeList.some(exId => String(exId) === catIdStr);
          }
        );
      })
    );
  }

  /**
   * Gera slug a partir do nome
   */
  generateSlug(nome: string): string {
    return nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  /**
   * Calcula o nível hierárquico de uma categoria
   */
  calculateCategoryLevel(categoryId: number | string, categories: Category[]): number {
    // ✅ Comparar convertendo ambos para string para garantir comparação correta
    const category = categories.find(c => String(c.id) === String(categoryId));
    if (!category || !category.categoriaPaiId) {
      return 1;
    }
    return 1 + this.calculateCategoryLevel(category.categoriaPaiId, categories);
  }

  /**
   * Valida se a categoria pode ser criada/editada sem exceder 3 níveis
   */
  validateMaxLevel(categoriaPaiId: number | string | null, excludeId?: number | string): Observable<{
    valid: boolean;
    message?: string;
  }> {
    if (!categoriaPaiId) {
      return of({ valid: true });
    }

    return this.getCategories().pipe(
      map(categories => {
        const level = this.calculateCategoryLevel(categoriaPaiId, categories);
        if (level >= 3) {
          return {
            valid: false,
            message: 'Não é possível criar categoria. Limite de 3 níveis hierárquicos atingido.'
          };
        }
        return { valid: true };
      })
    );
  }

  /**
   * Valida se categoria não está tentando ser pai de si mesma
   */
  validateNotSelfParent(categoryId: number | string | null, categoriaPaiId: number | string | null): boolean {
    if (!categoryId || !categoriaPaiId) return true;
    // ✅ Comparar convertendo ambos para string para garantir comparação correta
    return String(categoryId) !== String(categoriaPaiId);
  }

  /**
   * Busca todas as categorias filhas de uma categoria (recursivo)
   */
  getChildCategories(categoryId: number, categories: Category[]): Category[] {
    const directChildren = categories.filter(c => c.categoriaPaiId === categoryId);
    let allChildren: Category[] = [...directChildren];
    
    directChildren.forEach(child => {
      allChildren = allChildren.concat(this.getChildCategories(child.id, categories));
    });
    
    return allChildren;
  }

  /**
   * Inativa uma categoria e todas suas filhas (cascata)
   */
  deactivateCategoryWithCascade(categoryId: number): Observable<Category[]> {
    return this.http.post<Category[]>(`${this.apiUrl}/categorias/${categoryId}/deactivate`, {}).pipe(
      tap(() => {
        this.logService.createLogSilent(
          'inactive',
          'Categoria',
          'Categoria foi inativada'
        );
      })
    );
  }

  /**
   * Inativa uma categoria com realocação de produtos
   */
  deactivateCategoryWithRelocation(categoryId: number, targetCategoryId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/categorias/${categoryId}/deactivate-with-relocation`, {
      targetCategoryId
    }).pipe(
      tap((result) => {
        this.logService.createLogSilent(
          'inactive',
          'Categoria',
          `Categoria foi inativada e ${result.produtosRealocados} produto(s) foram realocados para "${result.categoriaDestino}"`
        );
      })
    );
  }
}


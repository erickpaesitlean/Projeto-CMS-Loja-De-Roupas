import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Alerta } from '../models/alerta.model';
import { ProductService } from './product.service';
import { CategoryService } from './category.service';
import { StoreService } from './store.service';
import { forkJoin, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface AlertProblem {
  type:
    | 'sku-duplicado'
    | 'codigo-barras-duplicado'
    | 'produto-sem-estoque'
    | 'produto-sem-imagem'
    | 'produto-ativo-sem-estoque'
    | 'produto-estoque-critico'
    | 'categoria-inativa'
    | 'loja-inativa'
    | 'unknown';
  title: string;
  description: string;
  items: any[]; // Lista de itens com o problema
  route: string; // Rota para resolver
}

@Injectable({
  providedIn: 'root'
})
export class AlertResolverService {
  private readonly router = inject(Router);
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly storeService = inject(StoreService);

  /**
   * Detecta o tipo de problema do alerta e retorna informações para resolução
   */
  detectAlertType(alerta: Alerta): Observable<AlertProblem> {
    const titulo = alerta.titulo.toLowerCase();
    const descricao = alerta.descricao.toLowerCase();

    // Estoque crítico (<=5)
    if (titulo.includes('estoque') && (titulo.includes('crítico') || titulo.includes('critico'))) {
      return this.getProblemByType('produto-estoque-critico');
    }

    // SKU Duplicado
    if (titulo.includes('sku') && (titulo.includes('duplicado') || descricao.includes('duplicado'))) {
      return this.getProblemByType('sku-duplicado');
    }

    // Código de Barras Duplicado
    if ((titulo.includes('código de barras') || titulo.includes('codigo de barras') || titulo.includes('ean') || titulo.includes('código')) 
        && (titulo.includes('duplicado') || descricao.includes('duplicado'))) {
      return this.getProblemByType('codigo-barras-duplicado');
    }

    // Produto ativo sem estoque (prioridade sobre produto sem estoque)
    if ((titulo.includes('ativo') || descricao.includes('ativo')) && (titulo.includes('estoque') || descricao.includes('estoque'))) {
      return this.getProblemByType('produto-ativo-sem-estoque');
    }

    // Produto sem estoque
    if (titulo.includes('estoque') || titulo.includes('sem estoque') || descricao.includes('sem estoque')) {
      return this.getProblemByType('produto-sem-estoque');
    }

    // Produto sem imagem
    if ((titulo.includes('imagem') || titulo.includes('sem imagem')) || (descricao.includes('imagem') && descricao.includes('sem'))) {
      return this.getProblemByType('produto-sem-imagem');
    }

    // Categoria inativa
    if (titulo.includes('categoria') && (titulo.includes('inativa') || descricao.includes('inativa'))) {
      return this.getProblemByType('categoria-inativa');
    }

    // Loja inativa
    if (titulo.includes('loja') && (titulo.includes('inativa') || descricao.includes('inativa'))) {
      return this.getProblemByType('loja-inativa');
    }

    // Tipo desconhecido
    return of({
      type: 'unknown' as const,
      title: alerta.titulo,
      description: alerta.descricao,
      items: [],
      route: '/dashboard'
    });
  }

  /**
   * Navega para a página de resolução do alerta
   */
  navigateToResolution(alerta: Alerta): void {
    this.detectAlertType(alerta).subscribe({
      next: (problem) => {
        this.router.navigate([problem.route], {
          queryParams: { alertaId: alerta.id }
        });
      },
      error: (err) => {
        console.error('Erro ao detectar tipo de alerta:', err);
        this.router.navigate(['/dashboard']);
      }
    });
  }

  /**
   * Obtém problema diretamente pelo tipo
   */
  getProblemByType(type: string): Observable<AlertProblem> {
    switch (type) {
      case 'sku-duplicado':
        return this.getDuplicateSkus().pipe(
          map(produtos => ({
            type: 'sku-duplicado' as const,
            title: 'SKUs Duplicados',
            description: 'Existem produtos com SKUs duplicados no sistema. Edite cada produto para corrigir o SKU.',
            items: produtos,
            route: '/alertas/resolver/sku-duplicado'
          }))
        );

      case 'codigo-barras-duplicado':
        return this.getDuplicateCodigoBarras().pipe(
          map(produtos => ({
            type: 'codigo-barras-duplicado' as const,
            title: 'Códigos de Barras Duplicados',
            description: 'Existem produtos com códigos de barras duplicados no sistema. Edite cada produto para corrigir o código.',
            items: produtos,
            route: '/alertas/resolver/codigo-barras-duplicado'
          }))
        );

      case 'produto-sem-estoque':
        return this.getProductsWithoutStock().pipe(
          map(produtos => ({
            type: 'produto-sem-estoque' as const,
            title: 'Produtos Sem Estoque',
            description: 'Produtos que não possuem estoque cadastrado em nenhuma loja.',
            items: produtos,
            route: '/alertas/resolver/produto-sem-estoque'
          }))
        );

      case 'produto-sem-imagem':
        return this.getProductsWithoutImages().pipe(
          map(produtos => ({
            type: 'produto-sem-imagem' as const,
            title: 'Produtos Sem Imagens',
            description: 'Produtos que não possuem imagens cadastradas.',
            items: produtos,
            route: '/alertas/resolver/produto-sem-imagem'
          }))
        );

      case 'produto-ativo-sem-estoque':
        return this.getActiveProductsWithoutStock().pipe(
          map(produtos => ({
            type: 'produto-ativo-sem-estoque' as const,
            title: 'Produtos Ativos Sem Estoque',
            description: 'Produtos ativos que não possuem estoque em lojas ativas.',
            items: produtos,
            route: '/alertas/resolver/produto-ativo-sem-estoque'
          }))
        );

      case 'produto-estoque-critico':
        return this.getCriticalStockProducts().pipe(
          map(produtos => ({
            type: 'produto-estoque-critico' as const,
            title: 'Estoque Crítico',
            description: 'Produtos ativos com estoque total em lojas ativas menor ou igual a 5.',
            items: produtos,
            route: '/alertas/resolver/produto-estoque-critico'
          })),
        );

      case 'categoria-inativa':
        return this.getInactiveCategories().pipe(
          map(categorias => ({
            type: 'categoria-inativa' as const,
            title: 'Categorias Inativas',
            description: 'Categorias que estão inativas no sistema.',
            items: categorias,
            route: '/alertas/resolver/categoria-inativa'
          }))
        );

      case 'loja-inativa':
        return this.getInactiveStores().pipe(
          map(lojas => ({
            type: 'loja-inativa' as const,
            title: 'Lojas Inativas',
            description: 'Lojas que estão inativas no sistema.',
            items: lojas,
            route: '/alertas/resolver/loja-inativa'
          }))
        );

      default:
        return of({
          type: 'unknown' as const,
          title: 'Problema Desconhecido',
          description: 'Tipo de problema não identificado.',
          items: [],
          route: '/dashboard'
        });
    }
  }

  // Métodos auxiliares para buscar problemas específicos
  private getDuplicateSkus(): Observable<any[]> {
    return this.productService.getProducts().pipe(
      map(produtos => {
        const skuMap = new Map<string, any[]>();
        produtos.forEach(produto => {
          const sku = produto.sku.toLowerCase();
          if (!skuMap.has(sku)) {
            skuMap.set(sku, []);
          }
          skuMap.get(sku)!.push(produto);
        });
        // Retorna grupos de produtos duplicados (com informação do SKU duplicado)
        return Array.from(skuMap.entries())
          .filter(([_, group]) => group.length > 1)
          .map(([sku, group]) => ({
            sku: sku,
            produtos: group,
            count: group.length,
            // Para compatibilidade, retorna o primeiro produto como item principal
            ...group[0],
            _isGroup: true,
            _groupData: group
          }));
      }),
      catchError(() => of([]))
    );
  }

  private getDuplicateCodigoBarras(): Observable<any[]> {
    return this.productService.getProducts().pipe(
      map(produtos => {
        const codigoMap = new Map<string, any[]>();
        produtos.forEach(produto => {
          const codigo = produto.codigoBarras;
          // Ignora códigos vazios ou nulos
          if (!codigo || codigo.trim() === '') return;
          if (!codigoMap.has(codigo)) {
            codigoMap.set(codigo, []);
          }
          codigoMap.get(codigo)!.push(produto);
        });
        // Retorna grupos de produtos duplicados
        return Array.from(codigoMap.entries())
          .filter(([_, group]) => group.length > 1)
          .map(([codigo, group]) => ({
            codigoBarras: codigo,
            produtos: group,
            count: group.length,
            ...group[0],
            _isGroup: true,
            _groupData: group
          }));
      }),
      catchError(() => of([]))
    );
  }

  private getProductsWithoutStock(): Observable<any[]> {
    return this.productService.getProducts().pipe(
      map(produtos => produtos.filter(p => {
        const totalStock = this.productService.calculateTotalStock(p.estoquePorLoja);
        return totalStock === 0;
      })),
      catchError(() => of([]))
    );
  }

  private getProductsWithoutImages(): Observable<any[]> {
    return this.productService.getProducts().pipe(
      map(produtos => produtos.filter(p => !p.imagens || p.imagens.length === 0)),
      catchError(() => of([]))
    );
  }

  private getActiveProductsWithoutStock(): Observable<any[]> {
    return forkJoin({
      produtos: this.productService.getProducts(),
      lojas: this.storeService.getStores()
    }).pipe(
      map(({ produtos, lojas }) => {
        const lojasAtivasIds = lojas.filter(l => l.status === 'ATIVA').map(l => l.id);
        return produtos.filter(p => {
          if (p.status !== 'ATIVO') return false;
          const temEstoqueEmLojaAtiva = p.estoquePorLoja.some(estoque => {
            const lojaId = typeof estoque.lojaId === 'string' ? Number(estoque.lojaId) : estoque.lojaId;
            return lojasAtivasIds.includes(lojaId) && estoque.quantidade > 0;
          });
          return !temEstoqueEmLojaAtiva;
        });
      }),
      catchError(() => of([]))
    );
  }

  private getCriticalStockProducts(): Observable<any[]> {
    const THRESHOLD = 5;
    return forkJoin({
      produtos: this.productService.getProducts(),
      lojas: this.storeService.getStores()
    }).pipe(
      map(({ produtos, lojas }) => {
        const lojasAtivasIds = lojas.filter(l => l.status === 'ATIVA').map(l => l.id);
        return produtos
          .filter(p => p.status === 'ATIVO')
          .map(p => {
            const totalStockAtivas = p.estoquePorLoja
              .filter(e => lojasAtivasIds.includes(typeof e.lojaId === 'string' ? Number(e.lojaId) : e.lojaId))
              .reduce((sum, e) => sum + (e.quantidade || 0), 0);
            return { ...p, _totalStockAtivas: totalStockAtivas };
          })
          .filter(p => p._totalStockAtivas <= THRESHOLD);
      }),
      catchError(() => of([])),
    );
  }

  private getInactiveCategories(): Observable<any[]> {
    return this.categoryService.getCategories().pipe(
      map(categorias => categorias.filter(c => c.status === 'INATIVA')),
      catchError(() => of([]))
    );
  }

  private getInactiveStores(): Observable<any[]> {
    return this.storeService.getStores().pipe(
      map(lojas => lojas.filter(l => l.status === 'INATIVA')),
      catchError(() => of([]))
    );
  }
}


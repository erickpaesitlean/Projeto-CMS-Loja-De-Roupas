import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, forkJoin, switchMap, of, tap, catchError } from 'rxjs';
import { Product, ProductFormData, ProductStatus } from '../models/product.model';
import { Category } from '../models/category.model';
import { Store } from '../models/store.model';
import { LogService } from './log.service';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly logService = inject(LogService);
  private readonly apiUrl = 'http://localhost:3000';

  /**
   * Busca todos os produtos
   */
  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/produtos`);
  }

  /**
   * Busca um produto por ID
   */
  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/produtos/${id}`);
  }

  /**
   * Cria um novo produto
   */
  createProduct(data: ProductFormData): Observable<Product> {
    // Não enviar id, createdAt e updatedAt - são gerados pelo backend
    return this.http.post<Product>(`${this.apiUrl}/produtos`, data).pipe(
      tap(product => {
        this.logService.createLogSilent(
          'create',
          'Produto',
          `Produto "${product.nome}" foi criado`
        );
      })
    );
  }

  /**
   * Atualiza um produto existente
   */
  updateProduct(id: number, data: ProductFormData): Observable<Product> {
    // Não enviar updatedAt - é gerado pelo backend
    return this.http.put<Product>(`${this.apiUrl}/produtos/${id}`, data).pipe(
      tap(product => {
        this.logService.createLogSilent(
          'edit',
          'Produto',
          `Produto "${product.nome}" foi editado`
        );
      })
    );
  }

  /**
   * Remove um produto
   */
  deleteProduct(id: number): Observable<any> {
    return this.getProductById(id).pipe(
      switchMap(product => {
        return this.http.delete<any>(`${this.apiUrl}/produtos/${id}`).pipe(
          tap(() => {
            this.logService.createLogSilent(
              'delete',
              'Produto',
              `Produto "${product.nome}" foi removido`
            );
          }),
          catchError(err => {
            console.error('Erro ao deletar produto:', err);
            throw err;
          })
        );
      }),
      catchError(err => {
        console.error('Erro ao buscar produto para deletar:', err);
        throw err;
      })
    );
  }

  /**
   * Busca categorias ativas para seleção
   */
  getActiveCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/categorias`).pipe(
      map(categorias => categorias.filter(cat => cat.status === 'ATIVA'))
    );
  }

  /**
   * Busca todas as lojas
   */
  getLojas(): Observable<Store[]> {
    return this.http.get<Store[]>(`${this.apiUrl}/lojas`);
  }

  /**
   * Busca apenas lojas ativas
   */
  getActiveStores(): Observable<Store[]> {
    return this.getLojas().pipe(
      map(lojas => lojas.filter(loja => loja.status === 'ATIVA'))
    );
  }

  /**
   * Valida se um produto pode ser ativado
   * Regra de negócio: Produto só pode ser ativado se:
   * - Todos os campos obrigatórios estiverem preenchidos
   * - Pelo menos 1 imagem estiver cadastrada
   * - Categoria estiver definida e ativa
   */
  canActivateProduct(product: Product | ProductFormData): Observable<{
    canActivate: boolean;
    reasons: string[];
  }> {
    const reasons: string[] = [];

    // Verifica campos obrigatórios
    if (!product.nome || product.nome.trim().length === 0) {
      reasons.push('Nome do produto é obrigatório');
    }
    if (!product.descricao || product.descricao.trim().length === 0) {
      reasons.push('Descrição é obrigatória');
    }
    if (!product.categoriaId) {
      reasons.push('Categoria é obrigatória');
    }
    if (!product.sku || product.sku.trim().length === 0) {
      reasons.push('SKU é obrigatório');
    }
    if (!product.codigoBarras || product.codigoBarras.trim().length === 0) {
      reasons.push('Código de barras é obrigatório');
    }
    if (!product.preco || product.preco <= 0) {
      reasons.push('Preço deve ser maior que zero');
    }

    // Verifica imagens
    if (!product.imagens || product.imagens.length === 0) {
      reasons.push('Pelo menos 1 imagem é obrigatória');
    } else if (product.imagens.length > 8) {
      reasons.push('Máximo de 8 imagens permitidas');
    }

    // ✅ MELHORADO: Verifica categoria ativa e loja ativa
    return forkJoin({
      // Busca TODAS as categorias para verificar o status da categoria selecionada
      todasCategorias: this.http.get<Category[]>(`${this.apiUrl}/categorias`),
      lojas: this.getActiveStores()
    }).pipe(
      map(({ todasCategorias, lojas }) => {
        // Validação de categoria (existente e ativa)
        if (product.categoriaId) {
          // Garante comparação correta de tipos (number vs string)
          const categoriaId = typeof product.categoriaId === 'string' ? Number(product.categoriaId) : product.categoriaId;
          const categoria = todasCategorias.find(cat => {
            const catId = typeof cat.id === 'string' ? Number(cat.id) : cat.id;
            return catId === categoriaId;
          });
          
          if (!categoria) {
            console.warn('Categoria não encontrada:', {
              categoriaId: product.categoriaId,
              categoriaIdType: typeof product.categoriaId,
              todasCategorias: todasCategorias.map(c => ({ id: c.id, nome: c.nome, status: c.status }))
            });
            reasons.push('Categoria selecionada não foi encontrada');
          } else if (categoria.status !== 'ATIVA') {
            console.warn('Categoria encontrada mas está inativa:', {
              categoriaId: categoria.id,
              nome: categoria.nome,
              status: categoria.status
            });
            reasons.push(`Categoria "${categoria.nome}" não está ativa`);
          }
        }

        // ✅ NOVA: Validar estoque em loja ativa
        // REGRA DE NEGÓCIO: Produtos ativos devem ter estoque > 0 em pelo menos uma loja ATIVA
        if (lojas.length === 0) {
          reasons.push('Não há lojas ativas cadastradas no sistema. Para ativar um produto, é necessário ter pelo menos uma loja ativa. Por favor, ative uma loja no sistema de gestão de lojas antes de tentar ativar o produto.');
        } else {
          // ✅ Garante comparação correta de tipos (number vs string)
          const estoquesComLojaAtiva = product.estoquePorLoja?.filter(estoque => {
            // Compara IDs convertendo ambos para string para garantir compatibilidade
            const loja = lojas.find(l => String(l.id) === String(estoque.lojaId));
            return loja !== undefined;
          }) || [];
          
          const hasActiveStoreStock = estoquesComLojaAtiva.some(estoque => estoque.quantidade > 0);
          
          if (!hasActiveStoreStock) {
            // ✅ Mensagem específica e clara sobre a regra de negócio
            if (!product.estoquePorLoja || product.estoquePorLoja.length === 0) {
              reasons.push(
                'Você não cadastrou estoque em nenhuma loja. Para ativar um produto, é necessário cadastrar estoque maior que zero em pelo menos uma loja ATIVA. ' +
                'Preencha o campo "Estoque por Loja" com uma quantidade maior que zero para uma loja que esteja ativa no sistema.'
              );
            } else {
              const estoqueEmLojasInativas = product.estoquePorLoja.filter(estoque => {
                const loja = lojas.find(l => String(l.id) === String(estoque.lojaId));
                return loja === undefined;
              });
              
              if (estoqueEmLojasInativas.length > 0) {
                reasons.push(
                  `Você cadastrou estoque em ${estoqueEmLojasInativas.length} loja(s) que não estão ativas no sistema. ` +
                  'Para ativar um produto, é necessário ter estoque maior que zero em pelo menos uma loja ATIVA. ' +
                  'Verifique se a loja onde você cadastrou o estoque está com status "ATIVA" no sistema de gestão de lojas, ou cadastre estoque em outra loja que esteja ativa.'
                );
              } else {
                // Tem estoque em lojas ativas, mas quantidade é zero
                const estoquesZeros = product.estoquePorLoja.filter(estoque => {
                  const loja = lojas.find(l => String(l.id) === String(estoque.lojaId));
                  return loja !== undefined && estoque.quantidade === 0;
                });
                
                if (estoquesZeros.length > 0) {
                  reasons.push(
                    'Você cadastrou estoque em loja(s) ativa(s), mas a quantidade está zerada. ' +
                    'Para ativar um produto, é necessário ter estoque MAIOR QUE ZERO em pelo menos uma loja ATIVA. ' +
                    'Aumente a quantidade de estoque em pelo menos uma loja ativa para poder ativar o produto.'
                  );
                } else {
                  reasons.push(
                    'Não foi possível validar o estoque do produto em lojas ativas. ' +
                    'Por favor, verifique se você cadastrou estoque maior que zero em pelo menos uma loja que esteja com status "ATIVA" no sistema.'
                  );
                }
              }
            }
          }
        }

        return {
          canActivate: reasons.length === 0,
          reasons
        };
      })
    );
  }

  /**
   * Verifica se um SKU já existe
   */
  isSkuUnique(sku: string, excludeId?: number): Observable<boolean> {
    return this.getProducts().pipe(
      map(produtos => {
        const exists = produtos.some(
          p => p.sku.toLowerCase() === sku.toLowerCase() && p.id !== excludeId
        );
        return !exists;
      })
    );
  }

  /**
   * Calcula o estoque total de um produto
   */
  calculateTotalStock(estoquePorLoja: { lojaId: number; quantidade: number }[]): number {
    return estoquePorLoja.reduce((total, estoque) => total + estoque.quantidade, 0);
  }

  /**
   * Calcula o percentual de desconto
   */
  calculateDiscountPercent(preco: number, precoPromocional: number | null): number | null {
    if (!precoPromocional || precoPromocional >= preco) {
      return null;
    }
    return Math.round(((preco - precoPromocional) / preco) * 100);
  }

  /**
   * Valida formato de imagem (simulado)
   */
  validateImageFormat(url: string): boolean {
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const lowerUrl = url.toLowerCase();
    return validExtensions.some(ext => lowerUrl.includes(ext));
  }

  /**
   * Valida tamanho de imagem (simulado - no frontend não temos acesso real ao tamanho)
   */
  validateImageSize(url: string): { valid: boolean; message?: string } {
    // Em produção, isso seria validado no backend
    // Por enquanto, apenas simulamos
    return { valid: true };
  }

  /**
   * Verifica se produto pode ser removido
   * Regra: Não pode remover se estiver vinculado a pedidos (simulado)
   */
  canDeleteProduct(productId: number): Observable<{
    canDelete: boolean;
    reason?: string;
  }> {
    // Simulação: produtos com ID par não podem ser removidos (simula pedidos)
    const canDelete = productId % 2 !== 0;
    return new Observable(observer => {
      observer.next({
        canDelete,
        reason: canDelete
          ? undefined
          : 'Produto não pode ser removido pois possui pedidos em andamento'
      });
      observer.complete();
    });
  }

  /**
   * Busca produtos filtrados
   */
  getFilteredProducts(filters: {
    categoriaId?: number;
    status?: ProductStatus;
    search?: string;
  }): Observable<Product[]> {
    return this.getProducts().pipe(
      map(produtos => {
        let filtered = produtos;

        if (filters.categoriaId) {
          filtered = filtered.filter(p => p.categoriaId === filters.categoriaId);
        }

        if (filters.status) {
          filtered = filtered.filter(p => p.status === filters.status);
        }

        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filtered = filtered.filter(
            p =>
              p.nome.toLowerCase().includes(searchLower) ||
              p.sku.toLowerCase().includes(searchLower) ||
              p.codigoBarras.includes(searchLower)
          );
        }

        return filtered;
      })
    );
  }
}


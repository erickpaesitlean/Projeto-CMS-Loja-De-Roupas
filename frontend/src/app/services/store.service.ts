import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, forkJoin, tap, switchMap } from 'rxjs';
import { Store, StoreFormData, StoreType } from '../models/store.model';
import { Product } from '../models/product.model';
import { LogService } from './log.service';

@Injectable({
  providedIn: 'root'
})
export class StoreService {
  private readonly http = inject(HttpClient);
  private readonly logService = inject(LogService);
  private readonly apiUrl = 'http://localhost:3000';

  /**
   * Busca todas as lojas
   */
  getStores(): Observable<Store[]> {
    return this.http.get<Store[]>(`${this.apiUrl}/lojas`);
  }

  /**
   * Busca uma loja por ID
   */
  getStoreById(id: number): Observable<Store> {
    return this.http.get<Store>(`${this.apiUrl}/lojas/${id}`);
  }

  /**
   * Cria uma nova loja
   */
  createStore(data: StoreFormData): Observable<Store> {
    // Não enviar createdAt e updatedAt - são gerados pelo backend
    return this.http.post<Store>(`${this.apiUrl}/lojas`, data).pipe(
      tap(store => {
        this.logService.createLogSilent(
          'create',
          'Loja',
          `Loja "${store.nome}" foi criada`
        );
      })
    );
  }

  /**
   * Atualiza uma loja existente
   */
  updateStore(id: number, data: StoreFormData): Observable<Store> {
    // Não enviar updatedAt - é gerado pelo backend
    return this.http.put<Store>(`${this.apiUrl}/lojas/${id}`, data).pipe(
      tap(store => {
        this.logService.createLogSilent(
          'update',
          'Loja',
          `Loja "${store.nome}" foi atualizada`
        );
      })
    );
  }

  /**
   * Remove uma loja
   */
  deleteStore(id: number): Observable<any> {
    console.log('StoreService.deleteStore chamado para loja:', id);
    return this.getStoreById(id).pipe(
      switchMap(store => {
        console.log('Loja encontrada para exclusão:', store);
        return this.http.delete<any>(`${this.apiUrl}/lojas/${id}`).pipe(
          tap((result) => {
            console.log('Loja removida com sucesso:', result);
            this.logService.createLogSilent(
              'delete',
              'Loja',
              `Loja "${store.nome}" foi removida`
            );
          })
        );
      })
    );
  }

  /**
   * Busca apenas lojas ativas
   */
  getActiveStores(): Observable<Store[]> {
    return this.getStores().pipe(
      map(stores => stores.filter(store => store.status === 'ATIVA'))
    );
  }

  /**
   * Busca produtos que possuem estoque em uma loja específica
   */
  getProductsInStore(storeId: number): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/produtos`).pipe(
      map(produtos => 
        produtos.filter(produto => 
          produto.estoquePorLoja.some(estoque => estoque.lojaId === storeId)
        )
      )
    );
  }

  /**
   * Verifica se uma loja possui produtos associados
   */
  hasProducts(storeId: number): Observable<boolean> {
    return this.getProductsInStore(storeId).pipe(
      map(produtos => produtos.length > 0)
    );
  }

  /**
   * Conta quantos produtos estão associados a uma loja
   */
  countProductsInStore(storeId: number): Observable<number> {
    return this.getProductsInStore(storeId).pipe(
      map(produtos => produtos.length)
    );
  }

  /**
   * Calcula o total de estoque de uma loja (soma de todos os produtos)
   */
  calculateTotalStock(storeId: number): Observable<number> {
    return this.getProductsInStore(storeId).pipe(
      map(produtos => {
        return produtos.reduce((total, produto) => {
          const estoqueLoja = produto.estoquePorLoja.find(e => e.lojaId === storeId);
          return total + (estoqueLoja?.quantidade || 0);
        }, 0);
      })
    );
  }

  /**
   * Simula a remoção de estoques de uma loja de todos os produtos
   * No frontend, apenas retorna os produtos que seriam afetados
   */
  simulateRemoveStoreStock(storeId: number): Observable<Product[]> {
    return this.getProductsInStore(storeId);
  }

  /**
   * Valida se o endereço é obrigatório baseado no tipo de loja
   */
  isAddressRequired(tipo: StoreType): boolean {
    return tipo === 'FISICA';
  }

  /**
   * Valida se todos os campos de endereço estão preenchidos
   */
  isAddressComplete(endereco: Store['endereco']): boolean {
    if (!endereco) return false;
    return !!(
      endereco.logradouro &&
      endereco.numero &&
      endereco.bairro &&
      endereco.cidade &&
      endereco.estado &&
      endereco.cep
    );
  }
}


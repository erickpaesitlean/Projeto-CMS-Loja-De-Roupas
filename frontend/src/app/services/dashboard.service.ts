import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, forkJoin, catchError, of, switchMap } from 'rxjs';
import { Product } from '../models/product.model';
import { Category } from '../models/category.model';
import { Store } from '../models/store.model';
import { Alerta } from '../models/alerta.model';
import { Log } from '../models/log.model';
import { Usuario } from '../models/usuario.model';
import { DashboardKPI } from '../models/dashboard-kpi.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = 'http://localhost:3000';

  getProdutos(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/produtos`);
  }

  getCategorias(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/categorias`);
  }

  getLojas(): Observable<Store[]> {
    return this.http.get<Store[]>(`${this.apiUrl}/lojas`);
  }

  getAlertas(): Observable<Alerta[]> {
    // ✅ Garante que os alertas estejam atualizados ao abrir o dashboard
    // (o backend cria/remove alertas automaticamente com base nas regras atuais)
    return this.http.post(`${this.apiUrl}/alertas/detectar`, {}).pipe(
      switchMap(() => this.http.get<Alerta[]>(`${this.apiUrl}/alertas`)),
      catchError((err) => {
        console.error('[DASHBOARD] Erro ao detectar/atualizar alertas:', err);
        // Fallback: tenta ao menos buscar os alertas existentes
        return this.http.get<Alerta[]>(`${this.apiUrl}/alertas`).pipe(
          catchError(() => of([])),
        );
      }),
    );
  }

  getLogs(): Observable<Log[]> {
    // ✅ Busca logs do último usuário que fez login APENAS da última sessão
    // Captura TODOS os tipos de ações: create, edit, update, delete, inactive, active, move
    const ultimoUsuario = this.authService.getUltimoUsuarioLogado();
    const timestampUltimoLogin = this.authService.getTimestampUltimoLogin();
    
    return this.http.get<Log[]>(`${this.apiUrl}/logs`).pipe(
      map(logs => {
        // Se não houver último usuário logado, retorna array vazio
        if (!ultimoUsuario || !ultimoUsuario.id) {
          console.log('[DASHBOARD] Nenhum último usuário logado encontrado');
          return [];
        }
        
        // Se não houver timestamp do último login, retorna array vazio
        // (significa que não há sessão anterior para filtrar)
        if (!timestampUltimoLogin) {
          console.log('[DASHBOARD] Nenhum timestamp de login encontrado - nenhuma sessão anterior');
          return [];
        }
        
        // Filtra apenas os logs do último usuário que fez login da última sessão
        const ultimoUsuarioId = typeof ultimoUsuario.id === 'string' ? Number(ultimoUsuario.id) : ultimoUsuario.id;
        const timestampLogin = new Date(timestampUltimoLogin).getTime();
        
        console.log(`[DASHBOARD] Buscando logs da última sessão do usuário: ${ultimoUsuario.nome} (ID: ${ultimoUsuarioId})`);
        console.log(`[DASHBOARD] Timestamp do último login: ${timestampUltimoLogin}`);
        console.log(`[DASHBOARD] Timestamp do último login (timestamp): ${timestampLogin}`);
        console.log(`[DASHBOARD] Total de logs disponíveis: ${logs.length}`);
        
        // Conta quantos logs pertencem ao último usuário (para debug)
        const logsDoUsuario = logs.filter(log => {
          const logUserId = typeof log.usuarioId === 'string' ? Number(log.usuarioId) : log.usuarioId;
          return logUserId === ultimoUsuarioId && logUserId !== undefined && logUserId !== null;
        });
        console.log(`[DASHBOARD] Total de logs do usuário ${ultimoUsuarioId}: ${logsDoUsuario.length}`);
        
        const logsFiltrados = logs.filter(log => {
          // Compara por ID do usuário (garantindo comparação numérica)
          const logUserId = typeof log.usuarioId === 'string' ? Number(log.usuarioId) : log.usuarioId;
          const logTimestamp = new Date(log.dataHora).getTime();
          
          // Debug: mostra alguns logs para entender o problema
          if (logs.indexOf(log) < 5) {
            console.log(`[DASHBOARD] Debug log ${logs.indexOf(log)}: usuarioId=${log.usuarioId} (${typeof log.usuarioId}), dataHora=${log.dataHora}, logTimestamp=${logTimestamp}, timestampLogin=${timestampLogin}`);
          }
          
          // Verifica se o log tem usuarioId
          if (logUserId === undefined || logUserId === null) {
            // Log sem usuarioId - não deve ser mostrado
            return false;
          }
          
          // Filtra: mesmo usuário E log criado APÓS o timestamp do login
          // Isso captura TODOS os tipos de ações da sessão: create, edit, update, delete, inactive, active, move
          const match = logUserId === ultimoUsuarioId && logTimestamp >= timestampLogin;
          
          if (match) {
            console.log(`[DASHBOARD] ✅ Log da sessão encontrado: [${log.tipo}] ${log.entidade} - ${log.descricao} (${log.dataHora}, userId=${logUserId}, timestamp=${logTimestamp})`);
          } else if (logUserId === ultimoUsuarioId && logTimestamp < timestampLogin) {
            console.log(`[DASHBOARD] ❌ Log do usuário mas fora da sessão: [${log.tipo}] ${log.descricao} (${log.dataHora}, timestamp=${logTimestamp} < ${timestampLogin})`);
          } else if (logUserId !== ultimoUsuarioId) {
            // Só mostra os primeiros logs de outros usuários para não poluir o console
            if (logs.indexOf(log) < 3) {
              console.log(`[DASHBOARD] ⚠️ Log de outro usuário: userId=${logUserId} (esperado ${ultimoUsuarioId})`);
            }
          }
          
          return match;
        });
        
        console.log(`[DASHBOARD] Logs da última sessão encontrados: ${logsFiltrados.length}`);
        
        return logsFiltrados.sort((a, b) => {
          // Ordena por data/hora mais recente primeiro
          return new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime();
        });
      }),
      catchError((error) => {
        console.error('[DASHBOARD] Erro ao buscar logs:', error);
        return of([]);
      })
    );
  }

  getUsuarioLogado(): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/usuarioLogado`);
  }

  getKPIs(): Observable<DashboardKPI[]> {
    return forkJoin({
      produtos: this.getProdutos(),
      categorias: this.getCategorias(),
      lojas: this.getLojas()
    }).pipe(
      map(({ produtos, categorias, lojas }) => {
        // ✅ CORRIGIDO: Usar Product model com status
        const produtosAtivos = produtos.filter(p => p.status === 'ATIVO').length;
        const produtosInativos = produtos.filter(p => p.status === 'INATIVO').length;
        
        // ✅ CORRIGIDO: Calcular estoque total por produto
        const produtosSemEstoque = produtos.filter(p => {
          const totalStock = p.estoquePorLoja.reduce((sum, e) => sum + e.quantidade, 0);
          return totalStock === 0;
        }).length;
        
        // ✅ CORRIGIDO: Verificar se tem preço promocional válido
        const produtosComPromocao = produtos.filter(p => 
          p.precoPromocional !== null && 
          p.precoPromocional < p.preco &&
          p.status === 'ATIVO'
        ).length;

        return [
          {
            titulo: 'Total de Produtos',
            valor: produtos.length,
            icone: 'package',
            rota: '/produtos',
            cor: '#3b82f6'
          },
          {
            titulo: 'Produtos Ativos',
            valor: produtosAtivos,
            icone: 'check-circle',
            rota: '/produtos?status=ativo',
            cor: '#10b981'
          },
          {
            titulo: 'Produtos Inativos',
            valor: produtosInativos,
            icone: 'x-circle',
            rota: '/produtos?status=inativo',
            cor: '#ef4444'
          },
          {
            titulo: 'Total de Categorias',
            valor: categorias.length,
            icone: 'folder',
            rota: '/categorias',
            cor: '#8b5cf6'
          },
          {
            titulo: 'Lojas Cadastradas',
            valor: lojas.length,
            icone: 'store',
            rota: '/lojas',
            cor: '#f59e0b'
          },
          {
            titulo: 'Produtos Sem Estoque',
            valor: produtosSemEstoque,
            icone: 'alert-triangle',
            rota: '/produtos?estoque=zero',
            cor: '#f97316'
          },
          {
            titulo: 'Produtos em Promoção',
            valor: produtosComPromocao,
            icone: 'trending-up',
            rota: '/produtos?promocao=ativa',
            cor: '#ec4899'
          }
        ];
      })
    );
  }

  buscarGlobal(termo: string): Observable<{
    produtos: Product[];
    categorias: Category[];
    lojas: Store[];
  }> {
    return forkJoin({
      produtos: this.getProdutos(),
      categorias: this.getCategorias(),
      lojas: this.getLojas()
    }).pipe(
      map(({ produtos, categorias, lojas }) => {
        const termoLower = termo.toLowerCase();
        return {
          produtos: produtos.filter(
            p =>
              p.nome.toLowerCase().includes(termoLower) ||
              p.sku.toLowerCase().includes(termoLower) ||
              p.codigoBarras.toLowerCase().includes(termoLower)
          ),
          categorias: categorias.filter(c =>
            c.nome.toLowerCase().includes(termoLower)
          ),
          lojas: lojas.filter(l =>
            l.nome.toLowerCase().includes(termoLower)
          )
        };
      })
    );
  }
}


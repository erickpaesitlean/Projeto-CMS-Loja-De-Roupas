import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, map, catchError, of } from 'rxjs';
import { signal, WritableSignal } from '@angular/core';
import { Colaborador, ColaboradorLogado, LoginCredentials, LoginResult } from '../models/colaborador.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = 'http://localhost:3000';
  private readonly TOKEN_STORAGE_KEY = 'authToken';

  /**
   * Signal para armazenar o usuário logado
   * null = não logado
   */
  private readonly _usuarioLogado: WritableSignal<ColaboradorLogado | null> = signal<ColaboradorLogado | null>(null);
  private readonly _token: WritableSignal<string | null> = signal<string | null>(null);

  /**
   * Signal readonly para expor o usuário logado
   */
  readonly usuarioLogado = this._usuarioLogado.asReadonly();

  constructor() {
    // Verificar se há usuário salvo no localStorage ao inicializar
    this.loadUsuarioFromStorage();
    this.loadTokenFromStorage();

    // Se token estiver inválido/expirado, limpa tudo
    if (!this.isAuthenticated()) {
      this.clearSession();
    }
  }

  /**
   * Realiza o login do colaborador
   * @param credentials Credenciais de login (email e senha)
   * @returns Observable com o resultado do login
   */
  login(credentials: LoginCredentials): Observable<LoginResult> {
    console.log('[AUTH] Iniciando login para:', credentials.email);
    
    // Usar endpoint de autenticação do backend
    return this.http.post<LoginResult>(`${this.apiUrl}/auth/login`, credentials).pipe(
      map((response: LoginResult) => {
        console.log('[AUTH] Resposta da API:', response);
        
        if (!response.success || !response.colaborador) {
          console.log('[AUTH] ❌ Login falhou:', response.message);
          return response;
        }

        const colaboradorSemSenha = response.colaborador;
        console.log('[AUTH] ✅ Login bem-sucedido para:', colaboradorSemSenha.nome, 'ID:', colaboradorSemSenha.id);

        // ✅ IMPORTANTE: Lógica para rastrear último usuário logado
        // Quando um novo usuário faz login:
        // 1. Se há um usuário atualmente logado (diferente), ele se torna o "último usuário"
        // 2. Se não há usuário logado mas há último salvo (diferente), mantém ele
        // 3. Se é o mesmo usuário fazendo login novamente, mantém o timestamp do login anterior
        // 4. Se não há último usuário, salva o atual como último
        const usuarioAtualLogado = this._usuarioLogado();
        const ultimoUsuarioSalvo = this.getUltimoUsuarioLogado();
        const timestampUltimoLoginSalvo = this.getTimestampUltimoLogin();
        
        // Compara IDs garantindo que ambos sejam números
        const usuarioAtualId = usuarioAtualLogado ? (typeof usuarioAtualLogado.id === 'string' ? Number(usuarioAtualLogado.id) : usuarioAtualLogado.id) : null;
        const ultimoId = ultimoUsuarioSalvo ? (typeof ultimoUsuarioSalvo.id === 'string' ? Number(ultimoUsuarioSalvo.id) : ultimoUsuarioSalvo.id) : null;
        const novoId = typeof colaboradorSemSenha.id === 'string' ? Number(colaboradorSemSenha.id) : colaboradorSemSenha.id;
        
        if (usuarioAtualLogado && usuarioAtualId !== null && usuarioAtualId !== novoId) {
          // Há um usuário diferente atualmente logado, ele se torna o "último usuário"
          // Busca o timestamp do login dele (do timestampLoginAtual ou do último salvo)
          let timestampLoginUsuarioAtual: string | null = null;
          try {
            timestampLoginUsuarioAtual = localStorage.getItem('timestampLoginAtual');
          } catch (error) {
            console.error('Erro ao buscar timestamp do login atual:', error);
          }
          
          // Se não encontrar, tenta buscar do último usuário salvo
          if (!timestampLoginUsuarioAtual) {
            timestampLoginUsuarioAtual = this.getTimestampUltimoLogin();
          }
          
          const timestampParaSalvar = timestampLoginUsuarioAtual || new Date().toISOString();
          
          console.log(`[AUTH] 🔄 Usuário anterior encontrado: ${usuarioAtualLogado.nome} (ID: ${usuarioAtualId})`);
          console.log(`[AUTH] Salvando como último usuário: ${usuarioAtualLogado.nome}`);
          console.log(`[AUTH] Timestamp do login: ${timestampParaSalvar}`);
          console.log(`[AUTH] Novo login: ${colaboradorSemSenha.nome} (ID: ${novoId})`);
          
          // Salva o usuário atual como último antes de atualizar
          this.saveUltimoUsuarioLogado(usuarioAtualLogado, timestampParaSalvar);
        } else if (!usuarioAtualLogado && ultimoUsuarioSalvo && ultimoId !== null && ultimoId !== novoId) {
          // Não há usuário logado, mas há um último usuário diferente salvo, mantém ele
          console.log(`[AUTH] ✅ Mantendo último usuário salvo: ${ultimoUsuarioSalvo.nome} (ID: ${ultimoId})`);
          console.log(`[AUTH] Timestamp do login do último usuário: ${timestampUltimoLoginSalvo}`);
          console.log(`[AUTH] Novo login: ${colaboradorSemSenha.nome} (ID: ${novoId})`);
          // Não atualiza nada - mantém o último usuário e seu timestamp
        } else if (ultimoUsuarioSalvo && ultimoId === novoId && timestampUltimoLoginSalvo) {
          // Mesmo usuário fazendo login novamente, mantém o timestamp do login anterior
          // Isso garante que os logs da sessão anterior continuem aparecendo
          console.log(`[AUTH] 🔄 Mesmo usuário fazendo login novamente: ${colaboradorSemSenha.nome} (ID: ${novoId})`);
          console.log(`[AUTH] Mantendo timestamp do login anterior: ${timestampUltimoLoginSalvo}`);
          // Mantém o timestamp do login anterior, não atualiza
          this.saveUltimoUsuarioLogado(colaboradorSemSenha, timestampUltimoLoginSalvo);
        } else {
          // Primeiro login ou não há timestamp salvo, salva o atual como último
          console.log(`[AUTH] 💾 Salvando novo último usuário: ${colaboradorSemSenha.nome} (ID: ${novoId})`);
          const timestampAtual = new Date().toISOString();
          this.saveUltimoUsuarioLogado(colaboradorSemSenha, timestampAtual);
        }

        // Salvar no signal
        this._usuarioLogado.set(colaboradorSemSenha);
        // Salvar token
        if (response.token) {
          this.setToken(response.token);
        }
        
        // Salvar no localStorage para persistência
        this.saveUsuarioToStorage(colaboradorSemSenha);
        
        // ✅ IMPORTANTE: Salva o timestamp do login do novo usuário em um local separado
        // Isso será usado quando ele fizer logout para salvar como último usuário
        const timestampAtual = new Date().toISOString();
        try {
          localStorage.setItem('timestampLoginAtual', timestampAtual);
          console.log(`[AUTH] 💾 Timestamp do login salvo: ${timestampAtual}`);
        } catch (error) {
          console.error('Erro ao salvar timestamp do login atual:', error);
        }

        // Redirecionar para o dashboard (todos têm as mesmas permissões)
        console.log('[AUTH] Redirecionando para dashboard...');
        this.router.navigate(['/dashboard']).then(() => {
          console.log('[AUTH] ✅ Redirecionamento concluído');
        }).catch((err) => {
          console.error('[AUTH] ❌ Erro ao redirecionar:', err);
        });

        return {
          success: true,
          colaborador: colaboradorSemSenha
        };
      }),
      catchError((error) => {
        console.error('[AUTH] ❌ Erro na requisição HTTP:', error);
        console.error('[AUTH] Detalhes do erro:', {
          message: error.message,
          status: error.status,
          url: error.url
        });
        
        // Se o backend retornou um erro estruturado, usar a mensagem dele
        if (error.error && error.error.message) {
          return of({
            success: false,
            message: error.error.message
          });
        }
        
        return of({
          success: false,
          message: 'Erro ao conectar com o servidor. Verifique se a API está rodando.'
        });
      })
    );
  }

  /**
   * Realiza logout do usuário
   */
  logout(): void {
    // ✅ IMPORTANTE: Quando um usuário faz logout, ele se torna o "último usuário"
    // Isso permite que o próximo usuário veja os logs da sessão anterior
    const usuarioAtual = this._usuarioLogado();
    if (usuarioAtual) {
      // Busca o timestamp do LOGIN dele (salvo quando ele fez login)
      // IMPORTANTE: Não usar o timestamp do logout, mas sim o do login
      let timestampLogin: string | null = null;
      try {
        timestampLogin = localStorage.getItem('timestampLoginAtual');
        console.log(`[AUTH] 🚪 Logout - Timestamp do login atual encontrado: ${timestampLogin}`);
      } catch (error) {
        console.error('Erro ao buscar timestamp do login atual:', error);
      }
      
      // Se não encontrar o timestamp do login atual, verifica se o usuário atual é o último salvo
      // Se for, usa o timestamp que já está salvo (do login anterior)
      if (!timestampLogin) {
        const ultimoUsuarioSalvo = this.getUltimoUsuarioLogado();
        const ultimoTimestamp = this.getTimestampUltimoLogin();
        const usuarioAtualId = typeof usuarioAtual.id === 'string' ? Number(usuarioAtual.id) : usuarioAtual.id;
        const ultimoId = ultimoUsuarioSalvo ? (typeof ultimoUsuarioSalvo.id === 'string' ? Number(ultimoUsuarioSalvo.id) : ultimoUsuarioSalvo.id) : null;
        
        if (ultimoId === usuarioAtualId && ultimoTimestamp) {
          // É o mesmo usuário, usa o timestamp do login anterior
          timestampLogin = ultimoTimestamp;
          console.log(`[AUTH] 🚪 Logout - Usando timestamp do login anterior: ${timestampLogin}`);
        } else {
          // Não é o mesmo usuário ou não há timestamp salvo
          // Neste caso, não devemos usar fallback porque perderíamos os logs
          // Se chegou aqui, significa que o timestampLoginAtual não foi salvo corretamente no login
          console.error(`[AUTH] ❌ Logout - Timestamp do login não encontrado para usuário ${usuarioAtual.nome} (ID: ${usuarioAtualId})`);
          console.error(`[AUTH] Último usuário salvo: ${ultimoUsuarioSalvo?.nome} (ID: ${ultimoId})`);
          console.error(`[AUTH] Timestamp do último usuário: ${ultimoTimestamp}`);
        }
      }
      
      // Se ainda não encontrar, NÃO usa fallback com timestamp atual (do logout)
      // Isso causaria perda de logs porque filtraria apenas logs após o logout
      // Em vez disso, usa um timestamp muito antigo para mostrar todos os logs do usuário
      const timestampParaSalvar = timestampLogin || '1970-01-01T00:00:00.000Z';
      
      if (!timestampLogin) {
        console.warn(`[AUTH] ⚠️ Logout - Timestamp do login não encontrado, usando timestamp mínimo para mostrar todos os logs`);
      }
      
      console.log(`[AUTH] 🚪 Logout - Salvando como último usuário: ${usuarioAtual.nome} (ID: ${usuarioAtual.id})`);
      console.log(`[AUTH] Timestamp do login a ser salvo: ${timestampParaSalvar}`);
      
      // Salva o usuário atual como último antes de fazer logout
      // O timestamp já é salvo dentro do objeto ultimoUsuarioLogado
      this.saveUltimoUsuarioLogado(usuarioAtual, timestampParaSalvar);
      
      // Limpa o timestamp do login atual
      try {
        localStorage.removeItem('timestampLoginAtual');
      } catch (error) {
        console.error('Erro ao limpar timestamp do login atual:', error);
      }
    }
    
    this._usuarioLogado.set(null);
    localStorage.removeItem('usuarioLogado');
    this.clearToken();
    this.router.navigate(['/login']);
  }

  /**
   * Verifica se o usuário está logado
   */
  isLoggedIn(): boolean {
    // Mantém compatibilidade com o código existente
    return this.isAuthenticated();
  }

  /**
   * Verifica autenticação REAL (JWT válido + usuário carregado)
   */
  isAuthenticated(): boolean {
    const token = this._token() || this.getTokenFromStorage();
    if (!token) return false;
    if (!this.isTokenValid(token)) return false;
    // Se token é válido mas usuário não está carregado, tenta carregar do storage
    if (!this._usuarioLogado()) {
      this.loadUsuarioFromStorage();
    }
    return this._usuarioLogado() !== null;
  }

  /**
   * Retorna token atual (se houver)
   */
  getToken(): string | null {
    return this._token() || this.getTokenFromStorage();
  }

  /**
   * Limpa estado de autenticação sem regras de "último usuário".
   * Útil para 401/expiração.
   */
  clearSession(): void {
    this._usuarioLogado.set(null);
    this.clearToken();
    try {
      localStorage.removeItem('usuarioLogado');
    } catch {
      // ignore
    }
  }

  /**
   * Retorna o usuário logado atual
   */
  getUsuarioLogado(): ColaboradorLogado | null {
    return this._usuarioLogado();
  }

  /**
   * Salva o usuário no localStorage
   */
  private saveUsuarioToStorage(colaborador: ColaboradorLogado): void {
    try {
      localStorage.setItem('usuarioLogado', JSON.stringify(colaborador));
    } catch (error) {
      console.error('Erro ao salvar usuário no localStorage:', error);
    }
  }

  /**
   * Carrega o usuário do localStorage
   */
  private loadUsuarioFromStorage(): void {
    try {
      const stored = localStorage.getItem('usuarioLogado');
      if (stored) {
        const colaborador = JSON.parse(stored) as ColaboradorLogado;
        this._usuarioLogado.set(colaborador);
      }
    } catch (error) {
      console.error('Erro ao carregar usuário do localStorage:', error);
      localStorage.removeItem('usuarioLogado');
    }
  }

  private setToken(token: string): void {
    this._token.set(token);
    try {
      localStorage.setItem(this.TOKEN_STORAGE_KEY, token);
    } catch (error) {
      console.error('Erro ao salvar token no localStorage:', error);
    }
  }

  private clearToken(): void {
    this._token.set(null);
    try {
      localStorage.removeItem(this.TOKEN_STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  private loadTokenFromStorage(): void {
    const token = this.getTokenFromStorage();
    if (token) {
      this._token.set(token);
    }
  }

  private getTokenFromStorage(): string | null {
    try {
      return localStorage.getItem(this.TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  }

  private isTokenValid(token: string): boolean {
    try {
      const payload = this.parseJwt(token);
      if (!payload) return false;
      // exp é em segundos (JWT)
      if (typeof payload.exp !== 'number') return true; // sem exp: considera válido (não ideal, mas evita false-negatives)
      const nowSec = Math.floor(Date.now() / 1000);
      return payload.exp > nowSec;
    } catch {
      return false;
    }
  }

  private parseJwt(token: string): any | null {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4 || 4)) % 4, '=');
    const json = decodeURIComponent(
      Array.prototype.map
        .call(atob(padded), (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(json);
  }

  /**
   * Salva o último usuário logado no localStorage
   * Isso permite rastrear qual foi o último usuário que fez login
   * e exibir seus logs no dashboard para qualquer usuário
   */
  private saveUltimoUsuarioLogado(colaborador: ColaboradorLogado, timestampLogin?: string): void {
    try {
      const ultimoUsuario = {
        id: colaborador.id,
        nome: colaborador.nome,
        email: colaborador.email,
        cargo: colaborador.cargo,
        dataLogin: timestampLogin || new Date().toISOString()
      };
      localStorage.setItem('ultimoUsuarioLogado', JSON.stringify(ultimoUsuario));
    } catch (error) {
      console.error('Erro ao salvar último usuário logado:', error);
    }
  }

  /**
   * Retorna o último usuário que fez login (para exibir seus logs)
   */
  getUltimoUsuarioLogado(): ColaboradorLogado | null {
    try {
      const stored = localStorage.getItem('ultimoUsuarioLogado');
      if (stored) {
        const ultimoUsuario = JSON.parse(stored);
        // Remove dataLogin antes de retornar
        const { dataLogin, ...usuario } = ultimoUsuario;
        return usuario as ColaboradorLogado;
      }
    } catch (error) {
      console.error('Erro ao carregar último usuário logado:', error);
    }
    return null;
  }

  /**
   * Retorna o timestamp do login do último usuário
   */
  getTimestampUltimoLogin(): string | null {
    try {
      const stored = localStorage.getItem('ultimoUsuarioLogado');
      if (stored) {
        const ultimoUsuario = JSON.parse(stored);
        return ultimoUsuario.dataLogin || null;
      }
    } catch (error) {
      console.error('Erro ao carregar timestamp do último login:', error);
    }
    return null;
  }

  /**
   * Salva o timestamp do login para filtrar logs da última sessão
   */
  private saveTimestampUltimoLogin(timestamp: string): void {
    try {
      localStorage.setItem('timestampUltimoLogin', timestamp);
    } catch (error) {
      console.error('Erro ao salvar timestamp do último login:', error);
    }
  }

  /**
   * Retorna o timestamp salvo do último login (para filtrar logs da sessão)
   */
  getTimestampUltimoLoginSalvo(): string | null {
    try {
      return localStorage.getItem('timestampUltimoLogin');
    } catch (error) {
      console.error('Erro ao carregar timestamp do último login:', error);
      return null;
    }
  }
}


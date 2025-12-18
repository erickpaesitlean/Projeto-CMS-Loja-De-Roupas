import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, switchMap } from 'rxjs';
import { Log, TipoLog } from '../models/log.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class LogService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = 'http://localhost:3000';

  /**
   * Cria um novo log de ação
   */
  createLog(
    tipo: TipoLog,
    entidade: string,
    descricao: string
  ): Observable<Log> {
    const usuarioLogado = this.authService.getUsuarioLogado();
    
    // Prepara os dados do log - não envia dataHora (Prisma gera automaticamente)
    // e não envia id (Prisma gera automaticamente)
    const logData: any = {
      tipo,
      entidade,
      descricao
    };

    // Só adiciona usuarioId e usuarioNome se o usuário estiver logado
    if (usuarioLogado?.id) {
      logData.usuarioId = typeof usuarioLogado.id === 'string' ? Number(usuarioLogado.id) : usuarioLogado.id;
      logData.usuarioNome = usuarioLogado.nome || null;
    }

    console.log('[LOG SERVICE] Criando log:', logData);
    console.log('[LOG SERVICE] Usuário logado:', usuarioLogado);
    
    return this.http.post<Log>(`${this.apiUrl}/logs`, logData);
  }

  /**
   * Cria log de forma silenciosa (não bloqueia a operação principal)
   */
  createLogSilent(
    tipo: TipoLog,
    entidade: string,
    descricao: string
  ): void {
    this.createLog(tipo, entidade, descricao).subscribe({
      next: () => {
        console.log(`[LOG] ${tipo} - ${entidade}: ${descricao}`);
      },
      error: (err) => {
        console.error('Erro ao criar log:', err);
        // Não bloqueia a operação principal se o log falhar
      }
    });
  }
}








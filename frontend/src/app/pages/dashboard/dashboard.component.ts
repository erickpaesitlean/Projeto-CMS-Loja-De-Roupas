import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardService } from '../../services/dashboard.service';
import { AuthService } from '../../services/auth.service';
import { CardsResumoComponent } from '../../components/cards-resumo/cards-resumo.component';
import { IconComponent } from '../../shared/icons/icon.component';
import { AlertResolverService } from '../../services/alert-resolver.service';
import { DashboardKPI } from '../../models/dashboard-kpi.model';
import { Alerta } from '../../models/alerta.model';
import { Log } from '../../models/log.model';
import { Usuario } from '../../models/usuario.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardsResumoComponent,
    IconComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly authService = inject(AuthService);
  private readonly alertResolver = inject(AlertResolverService);

  kpis = signal<DashboardKPI[]>([]);
  alertas = signal<Alerta[]>([]);
  logs = signal<Log[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  // Usuário logado atual (para exibir no header)
  usuarioLogado = computed<Usuario | null>(() => {
    const colaborador = this.authService.usuarioLogado();
    if (!colaborador) {
      return null;
    }
    // Converte ColaboradorLogado para Usuario
    return {
      id: colaborador.id,
      nome: colaborador.nome,
      email: colaborador.email,
      cargo: colaborador.cargo
    };
  });

  // ✅ NOVO: Último usuário que fez login (para exibir seus logs)
  ultimoUsuarioLogado = computed<Usuario | null>(() => {
    const ultimoColaborador = this.authService.getUltimoUsuarioLogado();
    if (!ultimoColaborador) {
      return null;
    }
    return {
      id: ultimoColaborador.id,
      nome: ultimoColaborador.nome,
      email: ultimoColaborador.email,
      cargo: ultimoColaborador.cargo
    };
  });

  // Alertas mais recentes (para listagem em tabela)
  alertasRecentes = computed<Alerta[]>(() => {
    const items = [...this.alertas()];
    items.sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());
    return items.slice(0, 8);
  });

  ngOnInit(): void {
    this.carregarDados();
  }

  carregarDados(): void {
    this.loading.set(true);
    this.error.set(null);

    this.dashboardService.getKPIs().subscribe({
      next: (kpis) => {
        this.kpis.set(kpis);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar KPIs:', err);
        this.error.set('Erro ao carregar dados do dashboard');
        this.loading.set(false);
      }
    });

    this.dashboardService.getAlertas().subscribe({
      next: (alertas) => {
        this.alertas.set(alertas);
      },
      error: (err) => {
        console.error('Erro ao carregar alertas:', err);
      }
    });

    this.dashboardService.getLogs().subscribe({
      next: (logs) => {
        this.logs.set(logs);
      },
      error: (err) => {
        console.error('Erro ao carregar logs:', err);
      }
    });

    // Não precisa buscar do endpoint, usa o AuthService que já tem o usuário logado
    // O usuarioLogado é um computed que observa o signal do AuthService
  }

  formatarData(dataHora: string): string {
    const data = new Date(dataHora);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(data);
  }

  getIconePorTipo(tipo: string): 'plus' | 'edit' | 'refresh' | 'trash' | 'x-circle' | 'check-circle' | 'activity' {
    switch (tipo) {
      case 'create':
        return 'plus';
      case 'edit':
        return 'edit';
      case 'update':
        return 'refresh';
      case 'delete':
        return 'trash';
      case 'inactive':
        return 'x-circle';
      case 'active':
        return 'check-circle';
      case 'move':
        return 'refresh';
      default:
        return 'activity';
    }
  }

  getTipoAlertaLabel(tipo: string): string {
    switch (tipo) {
      case 'error':
        return 'Erro';
      case 'warning':
        return 'Alerta';
      case 'info':
        return 'Info';
      default:
        return 'Info';
    }
  }

  getTipoAlertaIcon(tipo: string): 'x-circle' | 'alert-triangle' | 'info' {
    switch (tipo) {
      case 'error':
        return 'x-circle';
      case 'warning':
        return 'alert-triangle';
      case 'info':
      default:
        return 'info';
    }
  }

  getTipoAlertaBadgeClass(tipo: string): string {
    return `badge badge-${tipo}`;
  }

  resolverAlerta(alerta: Alerta, event?: Event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.alertResolver.navigateToResolution(alerta);
  }

  // Sidebar e logout agora ficam no AppShell (layout persistente)
}


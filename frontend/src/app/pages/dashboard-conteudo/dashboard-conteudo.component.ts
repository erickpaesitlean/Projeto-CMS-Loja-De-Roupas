import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DashboardService } from '../../services/dashboard.service';
import { AuthService } from '../../services/auth.service';
import { CardsResumoComponent } from '../../components/cards-resumo/cards-resumo.component';
import { ListaAlertasComponent } from '../../components/lista-alertas/lista-alertas.component';
import { AtalhosRapidosComponent } from '../../components/atalhos-rapidos/atalhos-rapidos.component';
import { BarraBuscaGlobalComponent } from '../../components/barra-busca-global/barra-busca-global.component';
import { IconComponent } from '../../shared/icons/icon.component';
import { DashboardKPI } from '../../models/dashboard-kpi.model';
import { Alerta } from '../../models/alerta.model';
import { Log } from '../../models/log.model';

@Component({
  selector: 'app-dashboard-conteudo',
  standalone: true,
  imports: [
    CommonModule,
    CardsResumoComponent,
    ListaAlertasComponent,
    AtalhosRapidosComponent,
    BarraBuscaGlobalComponent,
    IconComponent
  ],
  templateUrl: './dashboard-conteudo.component.html',
  styleUrl: './dashboard-conteudo.component.scss'
})
export class DashboardConteudoComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  kpis = signal<DashboardKPI[]>([]);
  alertas = signal<Alerta[]>([]);
  logs = signal<Log[]>([]);
  usuarioLogado = signal(this.authService.getUsuarioLogado());
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    // Verificar se está logado
    if (!this.authService.isAuthenticated()) {
      // Redirecionar para login se não estiver logado
      this.router.navigate(['/login']);
      return;
    }

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
      default:
        return 'activity';
    }
  }

  logout(): void {
    this.authService.logout();
  }
}


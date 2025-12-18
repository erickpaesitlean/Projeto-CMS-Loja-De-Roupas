import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Alerta } from '../../models/alerta.model';
import { IconComponent } from '../../shared/icons/icon.component';
import { AlertResolverService } from '../../services/alert-resolver.service';

@Component({
  selector: 'app-lista-alertas',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './lista-alertas.component.html',
  styleUrl: './lista-alertas.component.scss'
})
export class ListaAlertasComponent {
  @Input({ required: true }) alertas: Alerta[] = [];
  private readonly alertResolver = inject(AlertResolverService);

  getIconePorTipo(tipo: string): 'alert-triangle' | 'info' | 'x-circle' {
    switch (tipo) {
      case 'error':
        return 'x-circle';
      case 'warning':
        return 'alert-triangle';
      case 'info':
        return 'info';
      default:
        return 'info';
    }
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

  onAlertaClick(alerta: Alerta): void {
    this.alertResolver.navigateToResolution(alerta);
  }
}


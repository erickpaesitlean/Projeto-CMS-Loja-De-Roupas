import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardKPI } from '../../models/dashboard-kpi.model';
import { IconComponent } from '../../shared/icons/icon.component';

@Component({
  selector: 'app-cards-resumo',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  templateUrl: './cards-resumo.component.html',
  styleUrl: './cards-resumo.component.scss'
})
export class CardsResumoComponent {
  @Input({ required: true }) kpis: DashboardKPI[] = [];
}


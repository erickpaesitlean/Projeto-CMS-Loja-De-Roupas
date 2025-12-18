import { Component, signal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DashboardService } from '../../services/dashboard.service';
import { Product } from '../../models/product.model';
import { Category } from '../../models/category.model';
import { Store } from '../../models/store.model';
import { IconComponent } from '../../shared/icons/icon.component';

interface ResultadoBusca {
  produtos: Product[];
  categorias: Category[];
  lojas: Store[];
}

@Component({
  selector: 'app-barra-busca-global',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './barra-busca-global.component.html',
  styleUrl: './barra-busca-global.component.scss'
})
export class BarraBuscaGlobalComponent {
  private readonly router = inject(Router);
  termoBusca = signal('');
  resultados = signal<ResultadoBusca | null>(null);
  mostrarResultados = signal(false);

  constructor(private dashboardService: DashboardService) {
    effect(() => {
      const termo = this.termoBusca();
      if (termo.length >= 2) {
        this.buscar(termo);
      } else {
        this.resultados.set(null);
        this.mostrarResultados.set(false);
      }
    });
  }

  buscar(termo: string): void {
    this.dashboardService.buscarGlobal(termo).subscribe({
      next: (resultados) => {
        this.resultados.set(resultados);
        this.mostrarResultados.set(true);
      },
      error: (error) => {
        console.error('Erro na busca:', error);
        this.resultados.set(null);
      }
    });
  }

  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.termoBusca.set(input.value);
  }

  fecharResultados(): void {
    this.mostrarResultados.set(false);
  }

  getTotalResultados(): number {
    const res = this.resultados();
    if (!res) return 0;
    return res.produtos.length + res.categorias.length + res.lojas.length;
  }

  navegarParaDetalhesProduto(produtoId: number): void {
    this.mostrarResultados.set(false);
    this.termoBusca.set('');
    this.router.navigate(['/produtos', produtoId, 'detalhes']);
  }
}


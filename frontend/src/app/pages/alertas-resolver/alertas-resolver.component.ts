import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertResolverService, AlertProblem } from '../../services/alert-resolver.service';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { StoreService } from '../../services/store.service';
import { IconComponent } from '../../shared/icons/icon.component';
import { Product } from '../../models/product.model';
import { Category } from '../../models/category.model';
import { Store } from '../../models/store.model';

@Component({
  selector: 'app-alertas-resolver',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './alertas-resolver.component.html',
  styleUrl: './alertas-resolver.component.scss'
})
export class AlertasResolverComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly alertResolver = inject(AlertResolverService);
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly storeService = inject(StoreService);

  problemType = signal<string>('');
  problem = signal<AlertProblem | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const type = params['type'];
      this.problemType.set(type);
      this.loadProblem(type);
    });
  }

  loadProblem(type: string): void {
    this.loading.set(true);
    this.error.set(null);

    // Carrega o problema diretamente pelo tipo
    this.alertResolver.getProblemByType(type).subscribe({
      next: (problem) => {
        this.problem.set(problem);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar problema:', err);
        this.error.set('Erro ao carregar informações do problema.');
        this.loading.set(false);
      }
    });
  }

  private getTitleForType(type: string): string {
    const titles: Record<string, string> = {
      'sku-duplicado': 'SKU Duplicado',
      'codigo-barras-duplicado': 'Código de Barras Duplicado',
      'produto-sem-estoque': 'Produto Sem Estoque',
      'produto-sem-imagem': 'Produto Sem Imagem',
      'produto-ativo-sem-estoque': 'Produto Ativo Sem Estoque',
      'produto-estoque-critico': 'Estoque Crítico',
      'categoria-inativa': 'Categoria Inativa',
      'loja-inativa': 'Loja Inativa'
    };
    return titles[type] || 'Alerta';
  }

  private getDescriptionForType(type: string): string {
    const descriptions: Record<string, string> = {
      'sku-duplicado': 'Existem produtos com SKUs duplicados',
      'codigo-barras-duplicado': 'Existem produtos com códigos de barras duplicados',
      'produto-sem-estoque': 'Produtos sem estoque cadastrado',
      'produto-sem-imagem': 'Produtos sem imagens cadastradas',
      'produto-ativo-sem-estoque': 'Produtos ativos sem estoque em lojas ativas',
      'produto-estoque-critico': 'Produtos ativos com estoque crítico (<= 5) em lojas ativas',
      'categoria-inativa': 'Categorias inativas',
      'loja-inativa': 'Lojas inativas'
    };
    return descriptions[type] || 'Problema detectado';
  }

  resolveItem(item: any): void {
    const problem = this.problem();
    if (!problem) return;

    switch (problem.type) {
      case 'sku-duplicado':
      case 'codigo-barras-duplicado':
      case 'produto-sem-estoque':
      case 'produto-sem-imagem':
      case 'produto-ativo-sem-estoque':
      case 'produto-estoque-critico':
        this.router.navigate(['/produtos', item.id, 'editar']);
        break;
      case 'categoria-inativa':
        this.router.navigate(['/categorias', item.slug || item.id, 'editar']);
        break;
      case 'loja-inativa':
        this.router.navigate(['/lojas', item.id, 'editar']);
        break;
    }
  }

  getItemDisplayName(item: any): string {
    if (item.nome) return item.nome;
    if (item.sku) return `SKU: ${item.sku}`;
    return `ID: ${item.id}`;
  }

  getItemDetails(item: any): string {
    const details: string[] = [];
    if (item.sku) details.push(`SKU: ${item.sku}`);
    if (item.codigoBarras) details.push(`Código: ${item.codigoBarras}`);
    if (item.status) details.push(`Status: ${item.status}`);
    return details.join(' • ');
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}


import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IconComponent } from '../../shared/icons/icon.component';

interface Atalho {
  titulo: string;
  rota: string;
  icone: 'package' | 'folder' | 'store' | 'image';
  descricao: string;
  cor: string;
}

@Component({
  selector: 'app-atalhos-rapidos',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  templateUrl: './atalhos-rapidos.component.html',
  styleUrl: './atalhos-rapidos.component.scss'
})
export class AtalhosRapidosComponent {
  atalhos: Atalho[] = [
    {
      titulo: 'Gerenciar Produtos',
      rota: '/produtos',
      icone: 'package',
      descricao: 'Gerenciar produtos do catálogo',
      cor: '#3b82f6'
    },
    {
      titulo: 'Cadastrar Categoria',
      rota: '/categorias',
      icone: 'folder',
      descricao: 'Gerenciar categorias de produtos',
      cor: '#8b5cf6'
    },
    {
      titulo: 'Adicionar Loja',
      rota: '/lojas/nova',
      icone: 'store',
      descricao: 'Cadastrar nova loja',
      cor: '#10b981'
    },
    {
      titulo: 'Gerenciar Vitrine',
      rota: '/vitrine',
      icone: 'image',
      descricao: 'Configurar página inicial do e-commerce',
      cor: '#ec4899'
    }
  ];
}


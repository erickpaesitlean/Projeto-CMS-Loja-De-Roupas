import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getKPIs() {
    // Total de Produtos
    const totalProdutos = await this.prisma.produto.count();

    // Produtos Ativos
    const produtosAtivos = await this.prisma.produto.count({
      where: { status: 'ATIVO' },
    });

    // Produtos Inativos
    const produtosInativos = await this.prisma.produto.count({
      where: { status: 'INATIVO' },
    });

    // Total de Categorias
    const totalCategorias = await this.prisma.categoria.count();

    // Lojas Cadastradas
    const lojasCadastradas = await this.prisma.loja.count();

    // Produtos Sem Estoque
    const produtosComEstoque = await this.prisma.produtoEstoque.findMany({
      select: { produtoId: true },
      distinct: ['produtoId'],
    });
    const produtosSemEstoque = totalProdutos - produtosComEstoque.length;

    // Produtos em Promoção
    const produtosComPromocao = await this.prisma.produto.findMany({
      where: {
        status: 'ATIVO',
        precoPromocional: { not: null },
      },
      select: {
        preco: true,
        precoPromocional: true,
      },
    });

    const produtosEmPromocao = produtosComPromocao.filter(
      (produto) =>
        produto.precoPromocional &&
        Number(produto.precoPromocional) < Number(produto.preco),
    ).length;

    return [
      {
        titulo: 'Total de Produtos',
        valor: totalProdutos,
        icone: 'package',
        rota: '/produtos',
        cor: '#3b82f6',
      },
      {
        titulo: 'Produtos Ativos',
        valor: produtosAtivos,
        icone: 'check-circle',
        rota: '/produtos?status=ativo',
        cor: '#10b981',
      },
      {
        titulo: 'Produtos Inativos',
        valor: produtosInativos,
        icone: 'x-circle',
        rota: '/produtos?status=inativo',
        cor: '#ef4444',
      },
      {
        titulo: 'Total de Categorias',
        valor: totalCategorias,
        icone: 'folder',
        rota: '/categorias',
        cor: '#8b5cf6',
      },
      {
        titulo: 'Lojas Cadastradas',
        valor: lojasCadastradas,
        icone: 'store',
        rota: '/lojas',
        cor: '#f59e0b',
      },
      {
        titulo: 'Produtos Sem Estoque',
        valor: produtosSemEstoque,
        icone: 'alert-triangle',
        rota: '/produtos?estoque=zero',
        cor: '#f97316',
      },
      {
        titulo: 'Produtos em Promoção',
        valor: produtosEmPromocao,
        icone: 'trending-up',
        rota: '/produtos?promocao=ativa',
        cor: '#ec4899',
      },
    ];
  }

  async search(termo: string) {
    const searchTerm = termo.toLowerCase();

    // Buscar produtos
    const produtos = await this.prisma.produto.findMany({
      where: {
        OR: [
          { nome: { contains: searchTerm, mode: 'insensitive' } },
          { sku: { contains: searchTerm, mode: 'insensitive' } },
          { codigoBarras: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      take: 10,
    });

    // Buscar categorias
    const categorias = await this.prisma.categoria.findMany({
      where: {
        nome: { contains: searchTerm, mode: 'insensitive' },
      },
      take: 10,
    });

    // Buscar lojas
    const lojas = await this.prisma.loja.findMany({
      where: {
        nome: { contains: searchTerm, mode: 'insensitive' },
      },
      take: 10,
    });

    return {
      produtos: produtos.map((produto) => ({
        id: produto.id,
        nome: produto.nome,
        descricao: produto.descricao,
        categoriaId: produto.categoriaId,
        preco: Number(produto.preco),
        precoPromocional: produto.precoPromocional
          ? Number(produto.precoPromocional)
          : null,
        sku: produto.sku,
        codigoBarras: produto.codigoBarras,
        tamanhos: produto.tamanhos,
        cores: produto.cores,
        imagens: produto.imagens,
        status: produto.status,
        createdAt: produto.createdAt.toISOString(),
        updatedAt: produto.updatedAt.toISOString(),
      })),
      categorias: categorias.map((categoria) => ({
        id: categoria.id,
        nome: categoria.nome,
        descricao: categoria.descricao,
        slug: categoria.slug,
        categoriaPaiId: categoria.categoriaPaiId,
        status: categoria.status,
      })),
      lojas: lojas.map((loja) => ({
        id: loja.id,
        nome: loja.nome,
        tipo: loja.tipo,
        endereco:
          loja.tipo === 'FISICA' && loja.logradouro
            ? {
                logradouro: loja.logradouro,
                numero: loja.numero || '',
                complemento: loja.complemento || undefined,
                bairro: loja.bairro || '',
                cidade: loja.cidade || '',
                estado: loja.estado || '',
                cep: loja.cep || '',
              }
            : null,
        horarioFuncionamento: loja.horarioFuncionamento,
        status: loja.status,
        createdAt: loja.createdAt.toISOString(),
        updatedAt: loja.updatedAt.toISOString(),
      })),
    };
  }
}

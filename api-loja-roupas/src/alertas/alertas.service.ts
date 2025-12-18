import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AlertasService {
  constructor(private prisma: PrismaService) {}

  async findAll(tipo?: string) {
    const where: any = {};
    if (tipo) {
      where.tipo = tipo;
    }

    const alertas = await this.prisma.alerta.findMany({
      where,
      orderBy: { dataHora: 'desc' },
    });

    return alertas.map((alerta) => ({
      id: alerta.id,
      tipo: alerta.tipo,
      titulo: alerta.titulo,
      descricao: alerta.descricao,
      dataHora: alerta.dataHora.toISOString(),
    }));
  }

  /**
   * Detecta problemas automaticamente e cria alertas se necessário
   */
  async detectAndCreateAlerts(): Promise<void> {
    const LOW_STOCK_THRESHOLD = 5;

    // Detectar SKUs duplicados
    const produtos = await this.prisma.produto.findMany({
      select: { id: true, nome: true, sku: true, codigoBarras: true },
    });

    const skuMap = new Map<string, any[]>();
    produtos.forEach(produto => {
      const sku = produto.sku.toLowerCase();
      if (!skuMap.has(sku)) {
        skuMap.set(sku, []);
      }
      skuMap.get(sku)!.push(produto);
    });

    const skusDuplicados = Array.from(skuMap.values()).filter(group => group.length > 1);
    if (skusDuplicados.length > 0) {
      const existeAlerta = await this.prisma.alerta.findFirst({
        where: {
          titulo: { contains: 'SKU Duplicado', mode: 'insensitive' },
        },
      });

      if (!existeAlerta) {
        await this.prisma.alerta.create({
          data: {
            tipo: 'error',
            titulo: 'SKU Duplicado',
            descricao: `Existem ${skusDuplicados.length} grupo(s) de produtos com SKUs duplicados. Clique para resolver.`,
          },
        });
      }
    }

    // Detectar códigos de barras duplicados
    const codigoMap = new Map<string, any[]>();
    produtos.forEach(produto => {
      const codigo = produto.codigoBarras;
      // Ignora códigos vazios ou nulos
      if (!codigo || codigo.trim() === '') return;
      if (!codigoMap.has(codigo)) {
        codigoMap.set(codigo, []);
      }
      codigoMap.get(codigo)!.push(produto);
    });

    const codigosDuplicados = Array.from(codigoMap.values()).filter(group => group.length > 1);
    if (codigosDuplicados.length > 0) {
      const existeAlerta = await this.prisma.alerta.findFirst({
        where: {
          titulo: { contains: 'Código de Barras Duplicado', mode: 'insensitive' },
        },
      });

      if (!existeAlerta) {
        await this.prisma.alerta.create({
          data: {
            tipo: 'error',
            titulo: 'Código de Barras Duplicado',
            descricao: `Existem ${codigosDuplicados.length} grupo(s) de produtos com códigos de barras duplicados. Clique para resolver.`,
          },
        });
      }
    }

    // Detectar produtos ativos sem estoque em lojas ativas
    const lojasAtivas = await this.prisma.loja.findMany({
      where: { status: 'ATIVA' },
      select: { id: true },
    });

    const lojasAtivasIds = lojasAtivas.map(l => l.id);
    const produtosAtivos = await this.prisma.produto.findMany({
      where: { status: 'ATIVO' },
      include: {
        estoques: true,
      },
    });

    const produtosAtivosSemEstoque = produtosAtivos.filter(produto => {
      const temEstoqueEmLojaAtiva = produto.estoques.some(estoque => {
        return lojasAtivasIds.includes(estoque.lojaId) && estoque.quantidade > 0;
      });
      return !temEstoqueEmLojaAtiva;
    });

    if (produtosAtivosSemEstoque.length > 0) {
      const existeAlerta = await this.prisma.alerta.findFirst({
        where: {
          titulo: { contains: 'Produto Ativo Sem Estoque', mode: 'insensitive' },
        },
      });

      if (!existeAlerta) {
        await this.prisma.alerta.create({
          data: {
            tipo: 'warning',
            titulo: 'Produto Ativo Sem Estoque',
            descricao: `${produtosAtivosSemEstoque.length} produto(s) ativo(s) sem estoque em lojas ativas. Clique para resolver.`,
          },
        });
      }
    }

    // ✅ NOVO: Detectar estoque crítico (<= 5) em lojas ativas
    // Regra: se o estoque total do produto (somando lojas ATIVAS) for <= 5, deve gerar alerta.
    // Obs: este alerta complementa o "Produto Ativo Sem Estoque" e pode incluir 0 se aplicável.
    const produtosComEstoqueCritico = produtosAtivos.filter(produto => {
      const totalEstoqueLojasAtivas = produto.estoques
        .filter(e => lojasAtivasIds.includes(e.lojaId))
        .reduce((sum, e) => sum + e.quantidade, 0);
      return totalEstoqueLojasAtivas <= LOW_STOCK_THRESHOLD;
    });

    const tituloEstoqueCritico = 'Estoque Crítico';
    const alertaEstoqueCriticoExistente = await this.prisma.alerta.findFirst({
      where: {
        titulo: { contains: tituloEstoqueCritico, mode: 'insensitive' },
      },
    });

    if (produtosComEstoqueCritico.length > 0) {
      const descricao = `${produtosComEstoqueCritico.length} produto(s) ativo(s) com estoque crítico (<= ${LOW_STOCK_THRESHOLD}) em lojas ativas. Clique para resolver.`;

      if (!alertaEstoqueCriticoExistente) {
        await this.prisma.alerta.create({
          data: {
            tipo: 'warning',
            titulo: tituloEstoqueCritico,
            descricao,
          },
        });
      } else {
        // Atualiza para manter contagem e data/hora sempre atuais
        await this.prisma.alerta.update({
          where: { id: alertaEstoqueCriticoExistente.id },
          data: { descricao, dataHora: new Date() },
        });
      }
    } else if (alertaEstoqueCriticoExistente) {
      // Se não há mais estoque crítico, remove o alerta para não ficar stale
      await this.prisma.alerta.delete({ where: { id: alertaEstoqueCriticoExistente.id } });
    }

    // Detectar produtos sem imagens
    const produtosSemImagens = await this.prisma.produto.findMany({
      where: {
        OR: [
          { imagens: { equals: [] } },
          { imagens: { equals: null } },
        ],
      },
      select: { id: true },
    });

    if (produtosSemImagens.length > 0) {
      const existeAlerta = await this.prisma.alerta.findFirst({
        where: {
          titulo: { contains: 'Produto Sem Imagem', mode: 'insensitive' },
        },
      });

      if (!existeAlerta) {
        await this.prisma.alerta.create({
          data: {
            tipo: 'warning',
            titulo: 'Produto Sem Imagem',
            descricao: `${produtosSemImagens.length} produto(s) sem imagens cadastradas. Clique para resolver.`,
          },
        });
      }
    }
  }
}

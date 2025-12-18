import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProdutoDto } from './dto/create-produto.dto';
import { UpdateProdutoDto } from './dto/update-produto.dto';
import { LogsService } from '../logs/logs.service';
import { TipoLog } from '../logs/dto/create-log.dto';

@Injectable()
export class ProdutosService {
  constructor(
    private prisma: PrismaService,
    private logsService: LogsService,
  ) {}

  async findAll(filters?: {
    categoriaId?: number;
    status?: string;
    search?: string;
  }) {
    const where: any = {};

    if (filters?.categoriaId) {
      where.categoriaId = filters.categoriaId;
    }

    if (filters?.status) {
      where.status = filters.status.toUpperCase();
    }

    if (filters?.search) {
      where.OR = [
        { nome: { contains: filters.search, mode: 'insensitive' } },
        { sku: { contains: filters.search, mode: 'insensitive' } },
        { codigoBarras: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const produtos = await this.prisma.produto.findMany({
      where,
      include: {
        categoria: true,
        estoques: {
          include: {
            loja: true,
          },
        },
      },
      orderBy: { nome: 'asc' },
    });

    // Transformar para o formato esperado pelo frontend
    const baseUrl = process.env.API_URL || 'http://localhost:3000';
    return produtos.map((produto) => ({
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
      estoquePorLoja: produto.estoques.map((estoque) => ({
        lojaId: estoque.lojaId,
        quantidade: estoque.quantidade,
      })),
      imagens: produto.imagens.map((img) => {
        let finalUrl: string;
        // Se a imagem já é uma URL completa (http/https), mantém como está
        if (img.startsWith('http://') || img.startsWith('https://')) {
          finalUrl = img;
        }
        // Se é uma URL relativa (começa com /), converte para URL completa do backend
        else if (img.startsWith('/')) {
          finalUrl = `${baseUrl}${img}`;
        }
        // Se não começa com /, assume que é um nome de arquivo e adiciona o caminho completo
        else {
          finalUrl = `${baseUrl}/uploads/produtos/${img}`;
        }
        console.log('🖼️ Processando imagem no findAll:', { original: img, final: finalUrl });
        return finalUrl;
      }),
      status: produto.status,
      createdAt: produto.createdAt.toISOString(),
      updatedAt: produto.updatedAt.toISOString(),
    }));
  }

  async findOne(id: number) {
    const produto = await this.prisma.produto.findUnique({
      where: { id },
      include: {
        categoria: true,
        estoques: {
          include: {
            loja: true,
          },
        },
      },
    });

    if (!produto) {
      throw new NotFoundException('Produto não encontrado');
    }

    const baseUrl = process.env.API_URL || 'http://localhost:3000';
    return {
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
      estoquePorLoja: produto.estoques.map((estoque) => ({
        lojaId: estoque.lojaId,
        quantidade: estoque.quantidade,
      })),
      imagens: produto.imagens.map((img) => {
        let finalUrl: string;
        // Se a imagem já é uma URL completa (http/https), mantém como está
        if (img.startsWith('http://') || img.startsWith('https://')) {
          finalUrl = img;
        }
        // Se é uma URL relativa (começa com /), converte para URL completa do backend
        else if (img.startsWith('/')) {
          finalUrl = `${baseUrl}${img}`;
        }
        // Se não começa com /, assume que é um nome de arquivo e adiciona o caminho completo
        else {
          finalUrl = `${baseUrl}/uploads/produtos/${img}`;
        }
        console.log('🖼️ Processando imagem no findOne:', { original: img, final: finalUrl });
        return finalUrl;
      }),
      status: produto.status,
      createdAt: produto.createdAt.toISOString(),
      updatedAt: produto.updatedAt.toISOString(),
    };
  }

  async validateSku(sku: string, excludeId?: number) {
    const where: any = { sku };
    if (excludeId) {
      where.id = { not: excludeId };
    }

    const produto = await this.prisma.produto.findFirst({ where });
    return { isUnique: !produto };
  }

  async canActivate(id: number) {
    const produto = await this.prisma.produto.findUnique({
      where: { id },
      include: {
        categoria: true,
        estoques: {
          include: {
            loja: true,
          },
        },
      },
    });

    if (!produto) {
      throw new NotFoundException('Produto não encontrado');
    }

    const reasons: string[] = [];

    // Verificar campos obrigatórios
    if (!produto.nome || !produto.descricao || !produto.sku) {
      reasons.push('Todos os campos obrigatórios devem estar preenchidos');
    }

    // Verificar imagens
    if (!produto.imagens || produto.imagens.length === 0) {
      reasons.push('Pelo menos 1 imagem deve estar cadastrada');
    }

    // Verificar categoria
    if (!produto.categoria || produto.categoria.status !== 'ATIVA') {
      reasons.push('Categoria deve estar definida e ativa');
    }

    // Verificar estoque
    const estoqueTotal = produto.estoques.reduce(
      (sum, estoque) => sum + estoque.quantidade,
      0,
    );
    const temEstoqueEmLojaAtiva = produto.estoques.some(
      (estoque) => estoque.quantidade > 0 && estoque.loja.status === 'ATIVA',
    );

    if (!temEstoqueEmLojaAtiva) {
      reasons.push(
        'Deve ter estoque > 0 em pelo menos uma loja com status ATIVA',
      );
    }

    return {
      canActivate: reasons.length === 0,
      reasons,
    };
  }

  async create(createProdutoDto: CreateProdutoDto, usuarioId?: number) {
    // Validar SKU único
    const skuExists = await this.prisma.produto.findUnique({
      where: { sku: createProdutoDto.sku },
    });

    if (skuExists) {
      throw new ConflictException('SKU já existe');
    }

    // Validar código de barras único
    const codigoBarrasExists = await this.prisma.produto.findUnique({
      where: { codigoBarras: createProdutoDto.codigoBarras },
    });

    if (codigoBarrasExists) {
      throw new ConflictException('Código de barras já existe');
    }

    // Validar categoria
    const categoria = await this.prisma.categoria.findUnique({
      where: { id: createProdutoDto.categoriaId },
    });

    if (!categoria) {
      throw new NotFoundException('Categoria não encontrada');
    }

    if (categoria.status !== 'ATIVA') {
      throw new BadRequestException('Categoria deve estar ativa');
    }

    // Validar preço promocional
    if (
      createProdutoDto.precoPromocional !== null &&
      createProdutoDto.precoPromocional !== undefined &&
      createProdutoDto.precoPromocional >= createProdutoDto.preco
    ) {
      throw new BadRequestException(
        'Preço promocional deve ser menor que o preço',
      );
    }

    // Validar lojas no estoque
    for (const estoque of createProdutoDto.estoquePorLoja) {
      const loja = await this.prisma.loja.findUnique({
        where: { id: estoque.lojaId },
      });

      if (!loja) {
        throw new NotFoundException(`Loja com ID ${estoque.lojaId} não encontrada`);
      }

      if (loja.status !== 'ATIVA') {
        throw new BadRequestException(
          `Loja com ID ${estoque.lojaId} deve estar ativa`,
        );
      }
    }

    // VALIDAÇÃO CRÍTICA: Produto ATIVO deve ter estoque > 0 em pelo menos uma loja ATIVA
    if (createProdutoDto.status === 'ATIVO') {
      const temEstoqueEmLojaAtiva = createProdutoDto.estoquePorLoja.some(
        (estoque) => {
          // Verificar se estoque > 0 e loja está ativa (já validado acima)
          return estoque.quantidade > 0;
        },
      );

      if (!temEstoqueEmLojaAtiva) {
        throw new BadRequestException(
          'Produto ATIVO deve ter estoque > 0 em pelo menos uma loja ATIVA',
        );
      }
    }

    // Criar produto
    const produto = await this.prisma.produto.create({
      data: {
        nome: createProdutoDto.nome,
        descricao: createProdutoDto.descricao,
        categoriaId: createProdutoDto.categoriaId,
        preco: createProdutoDto.preco,
        precoPromocional: createProdutoDto.precoPromocional,
        sku: createProdutoDto.sku,
        codigoBarras: createProdutoDto.codigoBarras,
        tamanhos: createProdutoDto.tamanhos,
        cores: createProdutoDto.cores,
        imagens: createProdutoDto.imagens,
        status: createProdutoDto.status,
      },
    });

    // Criar estoques
    if (createProdutoDto.estoquePorLoja.length > 0) {
      await Promise.all(
        createProdutoDto.estoquePorLoja.map((estoque) =>
          this.prisma.produtoEstoque.create({
            data: {
              produtoId: produto.id,
              lojaId: estoque.lojaId,
              quantidade: estoque.quantidade,
            },
          }),
        ),
      );
    }

    // Criar log
    await this.logsService.create({
      tipo: TipoLog.CREATE,
      entidade: 'Produto',
      descricao: `Produto '${produto.nome}' foi criado`,
      usuarioId,
    });

    return this.findOne(produto.id);
  }

  async update(
    id: number,
    updateProdutoDto: UpdateProdutoDto,
    usuarioId?: number,
  ) {
    const produto = await this.prisma.produto.findUnique({
      where: { id },
    });

    if (!produto) {
      throw new NotFoundException('Produto não encontrado');
    }

    // Validar SKU único (se foi alterado)
    if (updateProdutoDto.sku && updateProdutoDto.sku !== produto.sku) {
      const skuExists = await this.prisma.produto.findUnique({
        where: { sku: updateProdutoDto.sku },
      });

      if (skuExists) {
        throw new ConflictException('SKU já existe');
      }
    }

    // Validar código de barras único (se foi alterado)
    if (
      updateProdutoDto.codigoBarras &&
      updateProdutoDto.codigoBarras !== produto.codigoBarras
    ) {
      const codigoBarrasExists = await this.prisma.produto.findUnique({
        where: { codigoBarras: updateProdutoDto.codigoBarras },
      });

      if (codigoBarrasExists) {
        throw new ConflictException('Código de barras já existe');
      }
    }

    // Validar categoria (se foi alterada)
    if (updateProdutoDto.categoriaId) {
      const categoria = await this.prisma.categoria.findUnique({
        where: { id: updateProdutoDto.categoriaId },
      });

      if (!categoria) {
        throw new NotFoundException('Categoria não encontrada');
      }

      if (categoria.status !== 'ATIVA') {
        throw new BadRequestException('Categoria deve estar ativa');
      }
    }

    // Validar preço promocional
    const preco = updateProdutoDto.preco ?? Number(produto.preco);
    if (
      updateProdutoDto.precoPromocional !== null &&
      updateProdutoDto.precoPromocional !== undefined &&
      updateProdutoDto.precoPromocional >= preco
    ) {
      throw new BadRequestException(
        'Preço promocional deve ser menor que o preço',
      );
    }

    // VALIDAÇÃO CRÍTICA: Se status está sendo alterado para ATIVO, verificar estoque
    const novoStatus = updateProdutoDto.status ?? produto.status;
    const estoquesParaValidar = updateProdutoDto.estoquePorLoja ?? 
      (await this.prisma.produtoEstoque.findMany({
        where: { produtoId: id },
        include: { loja: true },
      })).map(e => ({ lojaId: e.lojaId, quantidade: e.quantidade }));

    if (novoStatus === 'ATIVO') {
      const temEstoqueEmLojaAtiva = estoquesParaValidar.some(
        async (estoque) => {
          const loja = await this.prisma.loja.findUnique({
            where: { id: estoque.lojaId },
          });
          return loja?.status === 'ATIVA' && estoque.quantidade > 0;
        },
      );

      // Verificar de forma síncrona
      let temEstoque = false;
      for (const estoque of estoquesParaValidar) {
        const loja = await this.prisma.loja.findUnique({
          where: { id: estoque.lojaId },
        });
        if (loja?.status === 'ATIVA' && estoque.quantidade > 0) {
          temEstoque = true;
          break;
        }
      }

      if (!temEstoque) {
        throw new BadRequestException(
          'Produto ATIVO deve ter estoque > 0 em pelo menos uma loja ATIVA',
        );
      }
    }

    // Atualizar produto
    const data: any = {};
    if (updateProdutoDto.nome) data.nome = updateProdutoDto.nome;
    if (updateProdutoDto.descricao) data.descricao = updateProdutoDto.descricao;
    if (updateProdutoDto.categoriaId)
      data.categoriaId = updateProdutoDto.categoriaId;
    if (updateProdutoDto.preco !== undefined) data.preco = updateProdutoDto.preco;
    if (updateProdutoDto.precoPromocional !== undefined)
      data.precoPromocional = updateProdutoDto.precoPromocional;
    if (updateProdutoDto.sku) data.sku = updateProdutoDto.sku;
    if (updateProdutoDto.codigoBarras)
      data.codigoBarras = updateProdutoDto.codigoBarras;
    if (updateProdutoDto.tamanhos) data.tamanhos = updateProdutoDto.tamanhos;
    if (updateProdutoDto.cores) data.cores = updateProdutoDto.cores;
    if (updateProdutoDto.imagens) data.imagens = updateProdutoDto.imagens;
    if (updateProdutoDto.status) data.status = updateProdutoDto.status;

    await this.prisma.produto.update({
      where: { id },
      data,
    });

    // Atualizar estoques se fornecidos
    if (updateProdutoDto.estoquePorLoja) {
      // Remover estoques existentes
      await this.prisma.produtoEstoque.deleteMany({
        where: { produtoId: id },
      });

      // Criar novos estoques
      if (updateProdutoDto.estoquePorLoja.length > 0) {
        await Promise.all(
          updateProdutoDto.estoquePorLoja.map((estoque) =>
            this.prisma.produtoEstoque.create({
              data: {
                produtoId: id,
                lojaId: estoque.lojaId,
                quantidade: estoque.quantidade,
              },
            }),
          ),
        );
      }
    }

    // Criar log
    await this.logsService.create({
      tipo: TipoLog.UPDATE,
      entidade: 'Produto',
      descricao: `Produto '${data.nome || produto.nome}' foi atualizado`,
      usuarioId,
    });

    return this.findOne(id);
  }

  async remove(id: number, usuarioId?: number) {
    const produto = await this.prisma.produto.findUnique({
      where: { id },
    });

    if (!produto) {
      throw new NotFoundException('Produto não encontrado');
    }

    // Verificar se pode ser removido (não possui pedidos em andamento)
    // Por enquanto, vamos apenas verificar se existe
    // Em um sistema completo, aqui verificaria pedidos

    await this.prisma.produto.delete({
      where: { id },
    });

    // Criar log
    await this.logsService.create({
      tipo: TipoLog.DELETE,
      entidade: 'Produto',
      descricao: `Produto '${produto.nome}' foi removido`,
      usuarioId,
    });

    return { message: 'Produto removido com sucesso' };
  }
}

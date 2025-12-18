import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLojaDto } from './dto/create-loja.dto';
import { UpdateLojaDto } from './dto/update-loja.dto';
import { LogsService } from '../logs/logs.service';
import { TipoLog } from '../logs/dto/create-log.dto';

@Injectable()
export class LojasService {
  constructor(
    private prisma: PrismaService,
    private logsService: LogsService,
  ) {}

  async findAll() {
    const lojas = await this.prisma.loja.findMany({
      orderBy: { nome: 'asc' },
    });

    // Transformar para o formato esperado pelo frontend
    return lojas.map((loja) => ({
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
    }));
  }

  async findActive() {
    const lojas = await this.prisma.loja.findMany({
      where: { status: 'ATIVA' },
      orderBy: { nome: 'asc' },
    });

    return lojas.map((loja) => ({
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
    }));
  }

  async findOne(id: number) {
    const loja = await this.prisma.loja.findUnique({
      where: { id },
    });

    if (!loja) {
      throw new NotFoundException('Loja não encontrada');
    }

    return {
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
    };
  }

  async create(createLojaDto: CreateLojaDto, usuarioId?: number) {
    // Validar endereço para lojas físicas
    if (createLojaDto.tipo === 'FISICA') {
      if (!createLojaDto.endereco) {
        throw new BadRequestException(
          'Endereço é obrigatório para lojas físicas',
        );
      }

      const { endereco } = createLojaDto;
      if (
        !endereco.logradouro ||
        !endereco.numero ||
        !endereco.bairro ||
        !endereco.cidade ||
        !endereco.estado ||
        !endereco.cep
      ) {
        throw new BadRequestException(
          'Todos os campos do endereço são obrigatórios para lojas físicas',
        );
      }
    }

    const data: any = {
      nome: createLojaDto.nome,
      tipo: createLojaDto.tipo,
      horarioFuncionamento: createLojaDto.horarioFuncionamento,
      status: createLojaDto.status,
    };

    if (createLojaDto.tipo === 'FISICA' && createLojaDto.endereco) {
      data.logradouro = createLojaDto.endereco.logradouro;
      data.numero = createLojaDto.endereco.numero;
      data.complemento = createLojaDto.endereco.complemento;
      data.bairro = createLojaDto.endereco.bairro;
      data.cidade = createLojaDto.endereco.cidade;
      data.estado = createLojaDto.endereco.estado;
      data.cep = createLojaDto.endereco.cep;
    }

    const loja = await this.prisma.loja.create({
      data,
    });

    // Criar log
    await this.logsService.create({
      tipo: TipoLog.CREATE,
      entidade: 'Loja',
      descricao: `Loja '${loja.nome}' foi criada`,
      usuarioId,
    });

    return this.findOne(loja.id);
  }

  async update(
    id: number,
    updateLojaDto: UpdateLojaDto,
    usuarioId?: number,
  ) {
    console.log('LojasService.update chamado', { id, updateLojaDto });
    
    const loja = await this.prisma.loja.findUnique({
      where: { id },
    });

    if (!loja) {
      console.error('Loja não encontrada:', id);
      throw new NotFoundException('Loja não encontrada');
    }
    
    console.log('Loja encontrada:', loja);

    // Verificar se está inativando a loja
    const isDeactivating = loja.status === 'ATIVA' && updateLojaDto.status === 'INATIVA';
    
    // Se está inativando, buscar estoques que serão removidos
    let estoquesRemovidos: any[] = [];
    if (isDeactivating) {
      estoquesRemovidos = await this.prisma.produtoEstoque.findMany({
        where: { lojaId: id },
        include: {
          produto: {
            select: {
              id: true,
              nome: true,
              status: true,
            },
          },
        },
      });
    }

    // Validar endereço para lojas físicas
    const tipo = updateLojaDto.tipo ?? loja.tipo;
    if (tipo === 'FISICA') {
      const endereco = updateLojaDto.endereco ?? {
        logradouro: loja.logradouro,
        numero: loja.numero,
        complemento: loja.complemento,
        bairro: loja.bairro,
        cidade: loja.cidade,
        estado: loja.estado,
        cep: loja.cep,
      };

      if (
        !endereco.logradouro ||
        !endereco.numero ||
        !endereco.bairro ||
        !endereco.cidade ||
        !endereco.estado ||
        !endereco.cep
      ) {
        throw new BadRequestException(
          'Todos os campos do endereço são obrigatórios para lojas físicas',
        );
      }
    }

    const data: any = {};

    if (updateLojaDto.nome) data.nome = updateLojaDto.nome;
    if (updateLojaDto.tipo) data.tipo = updateLojaDto.tipo;
    if (updateLojaDto.horarioFuncionamento)
      data.horarioFuncionamento = updateLojaDto.horarioFuncionamento;
    if (updateLojaDto.status) data.status = updateLojaDto.status;

    if (tipo === 'FISICA' && updateLojaDto.endereco) {
      data.logradouro = updateLojaDto.endereco.logradouro;
      data.numero = updateLojaDto.endereco.numero;
      data.complemento = updateLojaDto.endereco.complemento;
      data.bairro = updateLojaDto.endereco.bairro;
      data.cidade = updateLojaDto.endereco.cidade;
      data.estado = updateLojaDto.endereco.estado;
      data.cep = updateLojaDto.endereco.cep;
    } else if (tipo === 'ONLINE') {
      // Limpar endereço para lojas online
      data.logradouro = null;
      data.numero = null;
      data.complemento = null;
      data.bairro = null;
      data.cidade = null;
      data.estado = null;
      data.cep = null;
    }

    // Atualizar a loja
    await this.prisma.loja.update({
      where: { id },
      data,
    });

    // Se está inativando, remover todos os estoques dessa loja
    if (isDeactivating && estoquesRemovidos.length > 0) {
      await this.prisma.produtoEstoque.deleteMany({
        where: { lojaId: id },
      });

      // Buscar todas as lojas ativas restantes
      const lojasAtivas = await this.prisma.loja.findMany({
        where: { status: 'ATIVA' },
        select: { id: true },
      });

      const lojasAtivasIds = lojasAtivas.map((l) => l.id);

      // Se não há lojas ativas, inativar todos os produtos ativos que tinham estoque na loja
      if (lojasAtivasIds.length === 0) {
        const produtosAtivosAfetados = estoquesRemovidos
          .filter((e) => e.produto.status === 'ATIVO')
          .map((e) => e.produto.id);

        if (produtosAtivosAfetados.length > 0) {
          await this.prisma.produto.updateMany({
            where: {
              id: { in: produtosAtivosAfetados },
            },
            data: {
              status: 'INATIVO',
            },
          });
        }
      } else {
        // Verificar quais produtos ficaram sem estoque em lojas ativas
        const produtosAfetadosIds = [
          ...new Set(estoquesRemovidos.map((e) => e.produto.id)),
        ];

        // Buscar todos os estoques dos produtos afetados em lojas ativas
        const estoquesEmLojasAtivas = await this.prisma.produtoEstoque.findMany({
          where: {
            produtoId: { in: produtosAfetadosIds },
            lojaId: { in: lojasAtivasIds },
            quantidade: { gt: 0 },
          },
          select: {
            produtoId: true,
          },
        });

        // Criar Set com IDs únicos de produtos que têm estoque em lojas ativas
        const produtosComEstoqueEmLojaAtiva = new Set(
          estoquesEmLojasAtivas.map((e) => e.produtoId),
        );

        // Identificar produtos ativos que não têm mais estoque em lojas ativas
        const produtosParaInativar = estoquesRemovidos
          .filter(
            (e) =>
              e.produto.status === 'ATIVO' &&
              !produtosComEstoqueEmLojaAtiva.has(e.produto.id),
          )
          .map((e) => e.produto.id);

        // Remover duplicatas
        const produtosParaInativarUnicos = [...new Set(produtosParaInativar)];

        // Inativar produtos que não têm mais estoque em lojas ativas
        if (produtosParaInativarUnicos.length > 0) {
          await this.prisma.produto.updateMany({
            where: {
              id: { in: produtosParaInativarUnicos },
            },
            data: {
              status: 'INATIVO',
            },
          });
        }
      }
    }

    // Criar log
    let descricaoLog = `Loja '${data.nome || loja.nome}' foi atualizada`;
    
    if (isDeactivating && estoquesRemovidos.length > 0) {
      descricaoLog += `. ${estoquesRemovidos.length} estoque(s) removido(s)`;
      
      // Contar produtos inativados
      const produtosInativados = await this.prisma.produto.count({
        where: {
          id: { in: estoquesRemovidos.map(e => e.produto.id) },
          status: 'INATIVO',
        },
      });
      
      if (produtosInativados > 0) {
        descricaoLog += `. ${produtosInativados} produto(s) inativado(s) por falta de estoque em lojas ativas`;
      }
    }

    await this.logsService.create({
      tipo: TipoLog.UPDATE,
      entidade: 'Loja',
      descricao: descricaoLog,
      usuarioId,
    });

    return this.findOne(id);
  }

  async remove(id: number, usuarioId?: number) {
    const loja = await this.prisma.loja.findUnique({
      where: { id },
    });

    if (!loja) {
      throw new NotFoundException('Loja não encontrada');
    }

    // Buscar todos os estoques que serão removidos (para log e verificação posterior)
    const estoquesRemovidos = await this.prisma.produtoEstoque.findMany({
      where: { lojaId: id },
      include: {
        produto: {
          select: {
            id: true,
            nome: true,
            status: true,
          },
        },
      },
    });

    // Deletar a loja (os estoques serão removidos automaticamente via cascade)
    await this.prisma.loja.delete({
      where: { id },
    });

    // Buscar todas as lojas ativas restantes
    const lojasAtivas = await this.prisma.loja.findMany({
      where: { status: 'ATIVA' },
      select: { id: true },
    });

    const lojasAtivasIds = lojasAtivas.map((l) => l.id);

    // Se não há lojas ativas, não precisa verificar estoques
    if (lojasAtivasIds.length === 0) {
      // Inativar todos os produtos ativos que tinham estoque na loja removida
      const produtosAtivosAfetados = estoquesRemovidos
        .filter((e) => e.produto.status === 'ATIVO')
        .map((e) => e.produto.id);

      if (produtosAtivosAfetados.length > 0) {
        await this.prisma.produto.updateMany({
          where: {
            id: { in: produtosAtivosAfetados },
          },
          data: {
            status: 'INATIVO',
          },
        });
      }

      const descricaoLog = `Loja '${loja.nome}' foi removida. ${estoquesRemovidos.length} estoque(s) removido(s). ${produtosAtivosAfetados.length} produto(s) inativado(s) por falta de lojas ativas`;

      await this.logsService.create({
        tipo: TipoLog.DELETE,
        entidade: 'Loja',
        descricao: descricaoLog,
        usuarioId,
      });

      return {
        message: 'Loja removida com sucesso',
        estoquesRemovidos: estoquesRemovidos.length,
        produtosInativados: produtosAtivosAfetados.length,
      };
    }

    // Obter IDs únicos dos produtos afetados
    const produtosAfetadosIds = [
      ...new Set(estoquesRemovidos.map((e) => e.produto.id)),
    ];

    // Buscar todos os estoques dos produtos afetados em lojas ativas (uma única query)
    const estoquesEmLojasAtivas = await this.prisma.produtoEstoque.findMany({
      where: {
        produtoId: { in: produtosAfetadosIds },
        lojaId: { in: lojasAtivasIds },
        quantidade: { gt: 0 },
      },
      select: {
        produtoId: true,
      },
    });

    // Criar Set com IDs únicos de produtos que têm estoque em lojas ativas
    const produtosComEstoqueEmLojaAtiva = new Set(
      estoquesEmLojasAtivas.map((e) => e.produtoId),
    );

    // Identificar produtos ativos que não têm mais estoque em lojas ativas
    const produtosParaInativar = estoquesRemovidos
      .filter(
        (e) =>
          e.produto.status === 'ATIVO' &&
          !produtosComEstoqueEmLojaAtiva.has(e.produto.id),
      )
      .map((e) => e.produto.id);

    // Remover duplicatas
    const produtosParaInativarUnicos = [...new Set(produtosParaInativar)];

    // Inativar produtos que não têm mais estoque em lojas ativas
    if (produtosParaInativarUnicos.length > 0) {
      await this.prisma.produto.updateMany({
        where: {
          id: { in: produtosParaInativarUnicos },
        },
        data: {
          status: 'INATIVO',
        },
      });
    }

    // Criar log detalhado
    const produtosInativados = produtosParaInativarUnicos.length;
    let descricaoLog = `Loja '${loja.nome}' foi removida`;
    
    if (estoquesRemovidos.length > 0) {
      descricaoLog += `. ${estoquesRemovidos.length} estoque(s) removido(s)`;
    }
    
    if (produtosInativados > 0) {
      descricaoLog += `. ${produtosInativados} produto(s) inativado(s) por falta de estoque em lojas ativas`;
    }

    await this.logsService.create({
      tipo: TipoLog.DELETE,
      entidade: 'Loja',
      descricao: descricaoLog,
      usuarioId,
    });

    return {
      message: 'Loja removida com sucesso',
      estoquesRemovidos: estoquesRemovidos.length,
      produtosInativados: produtosInativados,
    };
  }

  async findProducts(id: number) {
    await this.findOne(id);

    const estoques = await this.prisma.produtoEstoque.findMany({
      where: { lojaId: id, quantidade: { gt: 0 } },
      include: {
        produto: true,
      },
    });

    return estoques.map((estoque) => estoque.produto);
  }
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';
import { LogsService } from '../logs/logs.service';
import { TipoLog } from '../logs/dto/create-log.dto';

@Injectable()
export class CategoriasService {
  constructor(
    private prisma: PrismaService,
    private logsService: LogsService,
  ) {}

  /**
   * Invariante de domínio:
   * Não permitir que uma categoria seja inativada se houver produtos vinculados
   * a ela OU a qualquer categoria descendente (recursivo).
   *
   * Observação: usamos "produtos vinculados" (independente do status) para manter
   * consistência com o restante do CMS e evitar estados inconsistentes no domínio.
   */
  private async assertNoProductsLinkedInCategoryTreeOrThrow(
    categoriaId: number,
  ): Promise<{ categoriaIds: number[]; totalProdutos: number }> {
    // Garante que a categoria existe (e já carrega estrutura básica)
    await this.findOne(categoriaId);

    const categoriasFilhasIds = await this.findAllChildCategories(categoriaId);
    const categoriaIds = [categoriaId, ...categoriasFilhasIds];

    const totalProdutos = await this.prisma.produto.count({
      where: { categoriaId: { in: categoriaIds } },
    });

    if (totalProdutos > 0) {
      throw new ConflictException({
        code: 'CATEGORY_HAS_LINKED_PRODUCTS',
        message:
          'Não é possível inativar esta categoria pois existem produtos vinculados. Realoque os produtos para outra categoria antes de continuar.',
        details: {
          categoriaId,
          categoriasAfetadas: categoriaIds,
          totalProdutos,
          requiresRelocation: true,
        },
      });
    }

    return { categoriaIds, totalProdutos };
  }

  private async validateHierarchy(
    categoriaPaiId: number | null,
    excludeId?: number,
  ): Promise<void> {
    if (!categoriaPaiId) return;

    // Verificar se categoria pai existe
    const categoriaPai = await this.prisma.categoria.findUnique({
      where: { id: categoriaPaiId },
    });

    if (!categoriaPai) {
      throw new NotFoundException('Categoria pai não encontrada');
    }

    // Verificar se categoria pai está ativa
    if (categoriaPai.status !== 'ATIVA') {
      throw new BadRequestException(
        'Categoria pai deve estar ativa para ser usada',
      );
    }

    // Verificar se não está tentando ser pai de si mesma
    if (excludeId && categoriaPaiId === excludeId) {
      throw new BadRequestException(
        'Categoria não pode ser pai de si mesma',
      );
    }

    // Verificar profundidade máxima (3 níveis)
    let profundidade = 1;
    let current: any = categoriaPai;

    while (current && current.categoriaPaiId) {
      profundidade++;
      if (profundidade > 2) {
        // Se a categoria pai já está no nível 2, adicionar mais uma seria nível 3
        throw new BadRequestException(
          'Máximo de 3 níveis hierárquicos permitidos',
        );
      }
      const next = await this.prisma.categoria.findUnique({
        where: { id: current.categoriaPaiId },
      });
      if (!next) break;
      current = next;
    }
  }

  async findAll() {
    return this.prisma.categoria.findMany({
      orderBy: { nome: 'asc' },
    });
  }

  async findActive(excludeId?: number) {
    const where: any = { status: 'ATIVA' };
    if (excludeId) {
      where.id = { not: excludeId };
    }
    return this.prisma.categoria.findMany({
      where,
      orderBy: { nome: 'asc' },
    });
  }

  async findOne(id: number) {
    const categoria = await this.prisma.categoria.findUnique({
      where: { id },
      include: {
        categoriaPai: true,
        categoriasFilhas: true,
      },
    });

    if (!categoria) {
      throw new NotFoundException('Categoria não encontrada');
    }

    return categoria;
  }

  async findBySlug(slug: string) {
    const categoria = await this.prisma.categoria.findUnique({
      where: { slug },
      include: {
        categoriaPai: true,
        categoriasFilhas: true,
      },
    });

    if (!categoria) {
      throw new NotFoundException('Categoria não encontrada');
    }

    return categoria;
  }

  // Função para gerar slug a partir do nome
  private generateSlug(nome: string): string {
    return nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9]+/g, '-') // Substitui caracteres especiais por hífen
      .replace(/(^-|-$)/g, ''); // Remove hífens no início e fim
  }

  // Função para garantir slug único
  private async ensureUniqueSlug(baseSlug: string, excludeId?: number): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const where: any = { slug };
      if (excludeId) {
        where.id = { not: excludeId };
      }

      const exists = await this.prisma.categoria.findFirst({ where });

      if (!exists) {
        return slug;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  async create(createCategoriaDto: CreateCategoriaDto, usuarioId?: number) {
    // Gerar slug automaticamente se não fornecido
    let slug = createCategoriaDto.slug;
    if (!slug || slug.trim() === '') {
      slug = this.generateSlug(createCategoriaDto.nome);
    }

    // Garantir que o slug seja único
    slug = await this.ensureUniqueSlug(slug);

    // Validar hierarquia
    await this.validateHierarchy(createCategoriaDto.categoriaPaiId ?? null);

    const categoria = await this.prisma.categoria.create({
      data: {
        ...createCategoriaDto,
        slug,
      },
    });

    // Criar log
    await this.logsService.create({
      tipo: TipoLog.CREATE,
      entidade: 'Categoria',
      descricao: `Categoria '${categoria.nome}' foi criada`,
      usuarioId,
    });

    return categoria;
  }

  async update(
    id: number,
    updateCategoriaDto: UpdateCategoriaDto,
    usuarioId?: number,
  ) {
    console.log('[CategoriasService] update chamado', { id, updateCategoriaDto });
    const categoria = await this.findOne(id);

    // Se o nome foi alterado, gerar novo slug automaticamente
    let slug = updateCategoriaDto.slug;
    if (updateCategoriaDto.nome && updateCategoriaDto.nome !== categoria.nome) {
      // Gerar slug a partir do novo nome
      slug = this.generateSlug(updateCategoriaDto.nome);
      // Garantir que seja único
      slug = await this.ensureUniqueSlug(slug, id);
    } else if (!slug) {
      // Se não há slug e o nome não mudou, manter o slug atual
      slug = categoria.slug;
    } else if (slug !== categoria.slug) {
      // Se slug foi fornecido e é diferente, garantir que seja único
      slug = await this.ensureUniqueSlug(slug, id);
    }

    // Validar hierarquia
    const categoriaPaiId =
      updateCategoriaDto.categoriaPaiId !== undefined
        ? updateCategoriaDto.categoriaPaiId
        : categoria.categoriaPaiId;
    await this.validateHierarchy(categoriaPaiId, id);

    // Verificar se o status está sendo alterado para INATIVA
    const statusAtual = categoria.status;
    const novoStatus = updateCategoriaDto.status;
    const estaInativando = statusAtual === 'ATIVA' && novoStatus === 'INATIVA';

    // ✅ REGRA DE DOMÍNIO (centralizada no service):
    // bloquear inativação se houver produtos na categoria OU em qualquer descendente
    if (estaInativando) {
      await this.assertNoProductsLinkedInCategoryTreeOrThrow(id);
    }

    const updated = await this.prisma.categoria.update({
      where: { id },
      data: {
        ...updateCategoriaDto,
        slug,
      },
    });

    // Se está inativando, inativar todas as categorias filhas em cascata
    if (estaInativando) {
      console.log(`Categoria ${id} (${categoria.nome}) foi inativada. Inativando categorias filhas em cascata.`);
      
      const inativarCascata = async (categoriaId: number) => {
        const categoria = await this.prisma.categoria.findUnique({
          where: { id: categoriaId },
          include: { categoriasFilhas: true },
        });

        if (categoria) {
          // Inativar a categoria atual se estiver ativa
          if (categoria.status === 'ATIVA') {
            await this.prisma.categoria.update({
              where: { id: categoriaId },
              data: { status: 'INATIVA' },
            });
            console.log(`Categoria filha ${categoriaId} (${categoria.nome}) inativada`);
          }

          // Inativar todas as filhas recursivamente (independente do status atual)
          for (const filha of categoria.categoriasFilhas) {
            await inativarCascata(filha.id);
          }
        }
      };

      // Buscar e inativar todas as categorias filhas
      const categoriasFilhas = await this.prisma.categoria.findMany({
        where: { categoriaPaiId: id },
      });

      console.log(`Encontradas ${categoriasFilhas.length} categorias filhas para inativar`);
      for (const filha of categoriasFilhas) {
        await inativarCascata(filha.id);
      }
      
      console.log(`Todas as categorias filhas da categoria ${id} foram inativadas`);
    }

    // Criar log
    const descricaoLog = estaInativando
      ? `Categoria '${updated.nome}' foi inativada junto com suas categorias filhas`
      : `Categoria '${updated.nome}' foi atualizada`;
    
    await this.logsService.create({
      tipo: TipoLog.UPDATE,
      entidade: 'Categoria',
      descricao: descricaoLog,
      usuarioId,
    });

    return updated;
  }

  async remove(id: number, usuarioId?: number) {
    const categoria = await this.findOne(id);

    // Verificar se possui produtos associados
    const produtos = await this.prisma.produto.findMany({
      where: { categoriaId: id },
    });

    if (produtos.length > 0) {
      throw new BadRequestException(
        'Categoria não pode ser removida pois possui produtos associados. É necessário realocar os produtos antes de remover.',
      );
    }

    // Verificar se possui categorias filhas
    const categoriasFilhas = await this.prisma.categoria.findMany({
      where: { categoriaPaiId: id },
    });

    if (categoriasFilhas.length > 0) {
      throw new BadRequestException(
        'Categoria não pode ser removida pois possui categorias filhas associadas. Use o endpoint de exclusão com realocação ou remova as categorias filhas primeiro.',
      );
    }

    await this.prisma.categoria.delete({
      where: { id },
    });

    // Criar log
    await this.logsService.create({
      tipo: TipoLog.DELETE,
      entidade: 'Categoria',
      descricao: `Categoria '${categoria.nome}' foi removida`,
      usuarioId,
    });

    return { message: 'Categoria removida com sucesso' };
  }

  async removeWithRelocation(
    id: number,
    targetCategoryId?: number,
    usuarioId?: number,
  ) {
    try {
      const categoria = await this.findOne(id);

      // Buscar produtos da categoria e de todas as categorias filhas
      const produtosInfo = await this.findProductsInCategoryAndChildren(id);
      
      console.log('removeWithRelocation - produtosInfo:', {
        totalProdutos: produtosInfo.totalProdutos,
        categoriasFilhasIds: produtosInfo.categoriasFilhasIds,
        produtosCategoria: produtosInfo.produtosCategoria.length,
        produtosFilhas: produtosInfo.produtosFilhas.length,
        targetCategoryId: targetCategoryId,
      });

      if (produtosInfo.totalProdutos === 0) {
        // Se não tem produtos, mas tem categorias filhas, ainda assim podemos excluir
        // desde que as categorias filhas também sejam excluídas
        if (produtosInfo.categoriasFilhasIds.length > 0) {
          console.log(`Categoria sem produtos, mas com ${produtosInfo.categoriasFilhasIds.length} categorias filhas. Excluindo recursivamente.`);
          
          // Excluir categorias filhas recursivamente mesmo sem produtos
          const excluirCascata = async (categoriaId: number) => {
            const categoria = await this.prisma.categoria.findUnique({
              where: { id: categoriaId },
              include: { categoriasFilhas: true },
            });

            if (categoria) {
              console.log(`Excluindo categoria ${categoriaId} (${categoria.nome}) - tem ${categoria.categoriasFilhas.length} filhas diretas`);
              
              // Primeiro excluir todas as filhas recursivamente
              for (const filha of categoria.categoriasFilhas) {
                console.log(`Excluindo filha ${filha.id} (${filha.nome}) recursivamente`);
                await excluirCascata(filha.id);
              }

              // Depois excluir a categoria atual
              console.log(`Excluindo categoria ${categoriaId} (${categoria.nome})`);
              await this.prisma.categoria.delete({
                where: { id: categoriaId },
              });
              console.log(`Categoria ${categoriaId} (${categoria.nome}) excluída com sucesso`);
            } else {
              console.log(`Categoria ${categoriaId} não encontrada`);
            }
          };

          // Excluir todas as categorias filhas primeiro
          const categoriasFilhas = await this.prisma.categoria.findMany({
            where: { categoriaPaiId: id },
          });

          console.log(`Encontradas ${categoriasFilhas.length} categorias filhas diretas da categoria ${id}:`, categoriasFilhas.map(c => ({ id: c.id, nome: c.nome })));

          for (const filha of categoriasFilhas) {
            console.log(`Iniciando exclusão recursiva da categoria filha ${filha.id} (${filha.nome})`);
            await excluirCascata(filha.id);
          }

          // Agora excluir a categoria pai
          console.log(`Excluindo categoria pai ${id} (${categoria.nome})`);
          await this.prisma.categoria.delete({
            where: { id },
          });
          console.log(`Categoria pai ${id} (${categoria.nome}) excluída com sucesso`);

          // Criar log
          try {
            await this.logsService.create({
              tipo: TipoLog.DELETE,
              entidade: 'Categoria',
              descricao: `Categoria '${categoria.nome}' e suas categorias filhas foram removidas`,
              usuarioId,
            });
          } catch (logError) {
            console.error('Erro ao criar log:', logError);
          }

          return {
            message: 'Categoria removida com sucesso',
            produtosRealocados: 0,
            categoriaDestino: null,
          };
        }
        // Se não tem produtos nem categorias filhas, apenas remover normalmente
        return this.remove(id, usuarioId);
      }

      // Se há produtos, targetCategoryId é obrigatório
      let categoriaDestino: any = null;
      if (produtosInfo.totalProdutos > 0) {
        if (!targetCategoryId) {
          throw new BadRequestException(
            'targetCategoryId é obrigatório quando há produtos para realocar',
          );
        }

        // Garantir que targetCategoryId seja um número
        const targetId = typeof targetCategoryId === 'string' 
          ? parseInt(targetCategoryId, 10) 
          : targetCategoryId;
        
        if (isNaN(targetId)) {
          throw new BadRequestException('ID da categoria de destino inválido');
        }

        // Verificar se categoria destino existe e está ativa
        categoriaDestino = await this.prisma.categoria.findUnique({
          where: { id: targetId },
        });

        if (!categoriaDestino) {
          throw new NotFoundException('Categoria de destino não encontrada');
        }

        if (categoriaDestino.status !== 'ATIVA') {
          throw new BadRequestException(
            'Categoria de destino deve estar ativa para receber produtos',
          );
        }

        // Realocar todos os produtos da categoria principal para a categoria destino
        if (produtosInfo.produtosCategoria.length > 0) {
          console.log(`Realocando ${produtosInfo.produtosCategoria.length} produtos da categoria principal ${id} para ${targetId}`);
          await this.prisma.produto.updateMany({
            where: { categoriaId: id },
            data: { categoriaId: targetId },
          });
        }

        // Realocar todos os produtos das categorias filhas para a categoria destino
        if (produtosInfo.produtosFilhas.length > 0) {
          console.log(`Realocando ${produtosInfo.produtosFilhas.length} produtos de ${produtosInfo.categoriasFilhasIds.length} categorias filhas para ${targetId}`);
          console.log('IDs das categorias filhas:', produtosInfo.categoriasFilhasIds);
          await this.prisma.produto.updateMany({
            where: { categoriaId: { in: produtosInfo.categoriasFilhasIds } },
            data: { categoriaId: targetId },
          });
        }
      }

      // Excluir categorias filhas recursivamente (produtos já foram realocados)
      // Usar o array completo de categorias filhas que já foi calculado
      const excluirCascata = async (categoriaId: number) => {
        const categoria = await this.prisma.categoria.findUnique({
          where: { id: categoriaId },
          include: { categoriasFilhas: true },
        });

        if (categoria) {
          // Primeiro excluir todas as filhas recursivamente
          for (const filha of categoria.categoriasFilhas) {
            await excluirCascata(filha.id);
          }

          // Depois excluir a categoria atual
          await this.prisma.categoria.delete({
            where: { id: categoriaId },
          });
        }
      };

      // Excluir todas as categorias filhas recursivamente
      // Usar o array completo de IDs de categorias filhas (inclui netas, bisnetas, etc.)
      if (produtosInfo.categoriasFilhasIds.length > 0) {
        console.log(`Excluindo ${produtosInfo.categoriasFilhasIds.length} categorias filhas recursivamente`);
        // Buscar todas as categorias filhas diretas primeiro
        const categoriasFilhasDiretas = await this.prisma.categoria.findMany({
          where: { categoriaPaiId: id },
        });

        console.log(`Encontradas ${categoriasFilhasDiretas.length} categorias filhas diretas:`, categoriasFilhasDiretas.map(c => ({ id: c.id, nome: c.nome })));

        // Excluir recursivamente cada categoria filha direta (isso excluirá todas as descendentes)
        for (const filha of categoriasFilhasDiretas) {
          console.log(`Excluindo categoria filha ${filha.id} (${filha.nome}) e suas descendentes`);
          await excluirCascata(filha.id);
        }
      }

      // Agora excluir a categoria pai
      console.log(`Excluindo categoria pai ${id} (${categoria.nome})`);
      await this.prisma.categoria.delete({
        where: { id },
      });

      // Criar log
      try {
        const descricao = produtosInfo.totalProdutos > 0 && categoriaDestino
          ? `Categoria '${categoria.nome}' foi removida e ${produtosInfo.totalProdutos} produto(s) foram realocados para '${categoriaDestino.nome}'`
          : produtosInfo.categoriasFilhasIds.length > 0
          ? `Categoria '${categoria.nome}' e suas ${produtosInfo.categoriasFilhasIds.length} categorias filhas foram removidas`
          : `Categoria '${categoria.nome}' foi removida`;
        
        await this.logsService.create({
          tipo: TipoLog.DELETE,
          entidade: 'Categoria',
          descricao,
          usuarioId,
        });
      } catch (logError) {
        console.error('Erro ao criar log:', logError);
      }

      return {
        message: 'Categoria removida com sucesso',
        produtosRealocados: produtosInfo.totalProdutos,
        categoriaDestino: categoriaDestino?.nome || null,
      };
    } catch (error) {
      console.error('Erro em removeWithRelocation:', error);
      throw error;
    }
  }

  async deactivate(id: number, usuarioId?: number) {
    const categoria = await this.findOne(id);

    // ✅ REGRA DE DOMÍNIO (centralizada no service):
    // bloquear inativação se houver produtos na categoria OU em qualquer descendente
    const { categoriaIds } = await this.assertNoProductsLinkedInCategoryTreeOrThrow(id);

    // Inativar categoria e todas as filhas em cascata
    const inativarCascata = async (categoriaId: number) => {
      const categoria = await this.prisma.categoria.findUnique({
        where: { id: categoriaId },
        include: { categoriasFilhas: true },
      });

      if (categoria) {
        await this.prisma.categoria.update({
          where: { id: categoriaId },
          data: { status: 'INATIVA' },
        });

        // Inativar todas as filhas recursivamente
        for (const filha of categoria.categoriasFilhas) {
          await inativarCascata(filha.id);
        }
      }
    };

    await inativarCascata(id);

    // Buscar todas as categorias inativadas (inclui descendentes)
    const categoriasInativadas = await this.prisma.categoria.findMany({
      where: {
        id: { in: categoriaIds },
      },
    });

    // Criar log
    await this.logsService.create({
      tipo: TipoLog.INACTIVE,
      entidade: 'Categoria',
      descricao: `Categoria '${categoria.nome}' e suas filhas foram inativadas`,
      usuarioId,
    });

    return categoriasInativadas;
  }

  async deactivateWithRelocation(
    id: number,
    targetCategoryId: number,
    usuarioId?: number,
  ) {
    try {
      // Garantir que targetCategoryId seja um número
      const targetId = typeof targetCategoryId === 'string' 
        ? parseInt(targetCategoryId, 10) 
        : targetCategoryId;
      
      if (isNaN(targetId)) {
        throw new BadRequestException('ID da categoria de destino inválido');
      }

      const categoria = await this.findOne(id);

      // Verificar se categoria destino existe e está ativa
      const categoriaDestino = await this.prisma.categoria.findUnique({
        where: { id: targetId },
      });

      if (!categoriaDestino) {
        throw new NotFoundException('Categoria de destino não encontrada');
      }

      if (categoriaDestino.status !== 'ATIVA') {
        throw new BadRequestException(
          'Categoria de destino deve estar ativa para receber produtos',
        );
      }

      // Buscar produtos da categoria e de todas as categorias filhas
      const produtosInfo = await this.findProductsInCategoryAndChildren(id);

      if (produtosInfo.totalProdutos === 0) {
        // Se não tem produtos, apenas inativar normalmente
        const result = await this.deactivate(id, usuarioId);
        const categoriaInativada = Array.isArray(result) ? result[0] : result;
        return {
          categoria: categoriaInativada || categoria,
          produtosRealocados: 0,
          categoriaDestino: null,
        };
      }

      // Realocar todos os produtos da categoria principal para a categoria destino
      if (produtosInfo.produtosCategoria.length > 0) {
        await this.prisma.produto.updateMany({
          where: { categoriaId: id },
          data: { categoriaId: targetId },
        });
      }

      // Realocar todos os produtos das categorias filhas para a categoria destino
      if (produtosInfo.produtosFilhas.length > 0) {
        await this.prisma.produto.updateMany({
          where: { categoriaId: { in: produtosInfo.categoriasFilhasIds } },
          data: { categoriaId: targetId },
        });
      }

      // Inativar categoria e todas as filhas em cascata
      const inativarCascata = async (categoriaId: number) => {
        const categoria = await this.prisma.categoria.findUnique({
          where: { id: categoriaId },
          include: { categoriasFilhas: true },
        });

        if (categoria) {
          await this.prisma.categoria.update({
            where: { id: categoriaId },
            data: { status: 'INATIVA' },
          });

          // Inativar todas as filhas recursivamente
          for (const filha of categoria.categoriasFilhas) {
            await inativarCascata(filha.id);
          }
        }
      };

      await inativarCascata(id);

      // Buscar a categoria inativada
      const categoriaInativada = await this.prisma.categoria.findUnique({
        where: { id },
      });

      if (!categoriaInativada) {
        throw new NotFoundException('Erro ao inativar categoria');
      }

      // Criar log
      try {
        await this.logsService.create({
          tipo: TipoLog.INACTIVE,
          entidade: 'Categoria',
          descricao: `Categoria '${categoria.nome}' foi inativada e ${produtosInfo.totalProdutos} produto(s) foram realocados para '${categoriaDestino.nome}'`,
          usuarioId: usuarioId,
        });
      } catch (logError) {
        // Log erro não deve impedir a operação
        console.error('Erro ao criar log:', logError);
      }

      return {
        categoria: categoriaInativada,
        produtosRealocados: produtosInfo.totalProdutos,
        categoriaDestino: categoriaDestino.nome,
      };
    } catch (error) {
      console.error('Erro em deactivateWithRelocation:', error);
      throw error;
    }
  }

  async findProducts(id: number) {
    await this.findOne(id);

    return this.prisma.produto.findMany({
      where: { categoriaId: id },
    });
  }

  /**
   * Busca todas as categorias filhas de uma categoria (recursivamente)
   */
  private async findAllChildCategories(parentId: number): Promise<number[]> {
    const childCategories = await this.prisma.categoria.findMany({
      where: { categoriaPaiId: parentId },
      select: { id: true },
    });

    let allChildren: number[] = [...childCategories.map(c => c.id)];

    // Buscar recursivamente as categorias filhas
    for (const child of childCategories) {
      const grandchildren = await this.findAllChildCategories(child.id);
      allChildren = [...allChildren, ...grandchildren];
    }

    return allChildren;
  }

  /**
   * Busca todos os produtos de uma categoria e suas categorias filhas
   */
  async findProductsInCategoryAndChildren(categoryId: number) {
    const categoria = await this.findOne(categoryId);
    
    // Buscar produtos da categoria principal
    const produtosCategoria = await this.prisma.produto.findMany({
      where: { categoriaId: categoryId },
      select: {
        id: true,
        nome: true,
        sku: true,
        categoriaId: true,
      },
    });

    // Buscar todas as categorias filhas
    const categoriasFilhasIds = await this.findAllChildCategories(categoryId);
    
    // Buscar produtos das categorias filhas
    const produtosFilhas = categoriasFilhasIds.length > 0
      ? await this.prisma.produto.findMany({
          where: { categoriaId: { in: categoriasFilhasIds } },
          select: {
            id: true,
            nome: true,
            sku: true,
            categoriaId: true,
          },
        })
      : [];

    return {
      categoria: {
        id: categoria.id,
        nome: categoria.nome,
      },
      produtosCategoria: produtosCategoria.map(p => ({
        ...p,
        origem: 'categoria',
      })),
      produtosFilhas: produtosFilhas.map(p => ({
        ...p,
        origem: 'categoria_filha',
      })),
      totalProdutos: produtosCategoria.length + produtosFilhas.length,
      categoriasFilhasIds,
    };
  }
}

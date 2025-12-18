import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { CategoriasService } from './categorias.service';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';

@Controller('categorias')
export class CategoriasController {
  constructor(private readonly categoriasService: CategoriasService) {}

  @Post()
  create(@Body() createCategoriaDto: CreateCategoriaDto) {
    return this.categoriasService.create(createCategoriaDto);
  }

  @Get()
  findAll() {
    return this.categoriasService.findAll();
  }

  @Get('active')
  findActive(@Query('excludeId') excludeId?: string) {
    const excludeIdNum = excludeId ? parseInt(excludeId, 10) : undefined;
    return this.categoriasService.findActive(excludeIdNum);
  }

  @Get('by-slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.categoriasService.findBySlug(slug);
  }

  @Get(':id/products')
  findProducts(@Param('id', ParseIntPipe) id: number) {
    return this.categoriasService.findProducts(id);
  }

  @Get(':id/products-with-children')
  findProductsWithChildren(@Param('id', ParseIntPipe) id: number) {
    return this.categoriasService.findProductsInCategoryAndChildren(id);
  }

  @Post(':id/remove-with-relocation')
  removeWithRelocation(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { targetCategoryId?: number | string | null },
  ) {
    console.log('[CategoriasController] removeWithRelocation chamado:', { id, body });
    
    // targetCategoryId é opcional - se não fornecido ou for null/undefined/string vazia, será undefined
    let targetCategoryId: number | undefined = undefined;
    
    // Só processa targetCategoryId se ele existir e não for null, undefined ou string vazia
    if (body.targetCategoryId !== undefined && body.targetCategoryId !== null && body.targetCategoryId !== '') {
      if (typeof body.targetCategoryId === 'string') {
        const parsed = parseInt(body.targetCategoryId, 10);
        if (isNaN(parsed)) {
          throw new BadRequestException('targetCategoryId deve ser um número válido');
        }
        targetCategoryId = parsed;
      } else if (typeof body.targetCategoryId === 'number') {
        if (isNaN(body.targetCategoryId)) {
          throw new BadRequestException('targetCategoryId deve ser um número válido');
        }
        targetCategoryId = body.targetCategoryId;
      }
    }
    
    console.log('[CategoriasController] targetCategoryId processado:', targetCategoryId);
    
    return this.categoriasService.removeWithRelocation(
      id,
      targetCategoryId,
    );
  }

  @Post(':id/deactivate-with-relocation')
  deactivateWithRelocation(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { targetCategoryId: number | string },
  ) {
    // Garantir que targetCategoryId seja um número
    const targetCategoryId = typeof body.targetCategoryId === 'string' 
      ? parseInt(body.targetCategoryId, 10) 
      : body.targetCategoryId;
    
    if (isNaN(targetCategoryId)) {
      throw new BadRequestException('targetCategoryId deve ser um número válido');
    }
    
    return this.categoriasService.deactivateWithRelocation(
      id,
      targetCategoryId,
    );
  }

  @Post(':id/deactivate')
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.categoriasService.deactivate(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoriaDto: UpdateCategoriaDto,
  ) {
    console.log('[CategoriasController] PUT /categorias/:id chamado', { id, updateCategoriaDto });
    try {
      return this.categoriasService.update(id, updateCategoriaDto);
    } catch (error) {
      console.error('[CategoriasController] Erro ao atualizar categoria:', error);
      throw error;
    }
  }

  @Patch(':id')
  updatePartial(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoriaDto: UpdateCategoriaDto,
  ) {
    console.log('[CategoriasController] PATCH /categorias/:id chamado', { id, updateCategoriaDto });
    return this.categoriasService.update(id, updateCategoriaDto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoriasService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoriasService.remove(id);
  }
}

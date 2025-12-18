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
} from '@nestjs/common';
import { ProdutosService } from './produtos.service';
import { CreateProdutoDto } from './dto/create-produto.dto';
import { UpdateProdutoDto } from './dto/update-produto.dto';

@Controller('produtos')
export class ProdutosController {
  constructor(private readonly produtosService: ProdutosService) {}

  @Post()
  create(@Body() createProdutoDto: CreateProdutoDto) {
    return this.produtosService.create(createProdutoDto);
  }

  @Get()
  findAll(
    @Query('categoriaId') categoriaId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const filters: any = {};
    if (categoriaId) {
      filters.categoriaId = parseInt(categoriaId, 10);
    }
    if (status) {
      filters.status = status;
    }
    if (search) {
      filters.search = search;
    }
    return this.produtosService.findAll(filters);
  }

  @Get('validate-sku')
  validateSku(
    @Query('sku') sku: string,
    @Query('excludeId') excludeId?: string,
  ) {
    const excludeIdNum = excludeId ? parseInt(excludeId, 10) : undefined;
    return this.produtosService.validateSku(sku, excludeIdNum);
  }

  @Get(':id/can-activate')
  canActivate(@Param('id', ParseIntPipe) id: number) {
    return this.produtosService.canActivate(id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.produtosService.findOne(id);
  }

  @Put(':id')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProdutoDto: UpdateProdutoDto,
  ) {
    console.log('PUT/PATCH /produtos/:id chamado', { id, updateProdutoDto });
    return this.produtosService.update(id, updateProdutoDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.produtosService.remove(id);
  }
}

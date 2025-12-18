import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { LojasService } from './lojas.service';
import { CreateLojaDto } from './dto/create-loja.dto';
import { UpdateLojaDto } from './dto/update-loja.dto';

@Controller('lojas')
export class LojasController {
  constructor(private readonly lojasService: LojasService) {}

  @Post()
  create(@Body() createLojaDto: CreateLojaDto) {
    return this.lojasService.create(createLojaDto);
  }

  @Get()
  findAll() {
    return this.lojasService.findAll();
  }

  @Get('active')
  findActive() {
    return this.lojasService.findActive();
  }

  @Get(':id/products')
  findProducts(@Param('id', ParseIntPipe) id: number) {
    return this.lojasService.findProducts(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLojaDto: UpdateLojaDto,
  ) {
    console.log('PUT /lojas/:id chamado', { id, updateLojaDto });
    return this.lojasService.update(id, updateLojaDto);
  }

  @Patch(':id')
  updatePartial(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLojaDto: UpdateLojaDto,
  ) {
    console.log('PATCH /lojas/:id chamado', { id, updateLojaDto });
    return this.lojasService.update(id, updateLojaDto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.lojasService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.lojasService.remove(id);
  }
}

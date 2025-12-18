import { Controller, Get, Query } from '@nestjs/common';
import { ColaboradoresService } from './colaboradores.service';

@Controller('colaboradores')
export class ColaboradoresController {
  constructor(private readonly colaboradoresService: ColaboradoresService) {}

  @Get()
  findAll(@Query('email') email?: string) {
    return this.colaboradoresService.findAll(email);
  }
}


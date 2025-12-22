import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { LogsService } from './logs.service';
import { CreateLogDto } from './dto/create-log.dto';

@Controller('logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Post()
  create(@Body() createLogDto: CreateLogDto) {
    return this.logsService.create(createLogDto);
  }

  @Get()
  findAll(
    @Query('usuarioId') usuarioId?: string,
    @Query('entidade') entidade?: string,
    @Query('tipo') tipo?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    const filters: any = {};

    if (usuarioId) {
      filters.usuarioId = parseInt(usuarioId, 10);
    }

    if (entidade) {
      filters.entidade = entidade;
    }

    if (tipo) {
      filters.tipo = tipo;
    }

    if (dataInicio) {
      filters.dataInicio = new Date(dataInicio);
    }

    if (dataFim) {
      filters.dataFim = new Date(dataFim);
    }

    return this.logsService.findAll(filters);
  }
}

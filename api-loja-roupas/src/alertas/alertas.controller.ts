import { Controller, Get, Query, Post } from '@nestjs/common';
import { AlertasService } from './alertas.service';

@Controller('alertas')
export class AlertasController {
  constructor(private readonly alertasService: AlertasService) {}

  @Get()
  findAll(@Query('tipo') tipo?: string) {
    return this.alertasService.findAll(tipo);
  }

  @Post('detectar')
  async detectarProblemas() {
    await this.alertasService.detectAndCreateAlerts();
    return { message: 'Detecção de problemas concluída' };
  }
}

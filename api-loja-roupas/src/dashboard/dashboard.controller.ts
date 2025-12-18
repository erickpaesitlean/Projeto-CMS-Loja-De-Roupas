import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('kpis')
  getKPIs() {
    return this.dashboardService.getKPIs();
  }

  @Get('search')
  search(@Query('termo') termo: string) {
    if (!termo) {
      return {
        produtos: [],
        categorias: [],
        lojas: [],
      };
    }
    return this.dashboardService.search(termo);
  }
}


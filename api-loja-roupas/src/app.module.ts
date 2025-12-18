import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ColaboradoresModule } from './colaboradores/colaboradores.module';
import { CategoriasModule } from './categorias/categorias.module';
import { LojasModule } from './lojas/lojas.module';
import { ProdutosModule } from './produtos/produtos.module';
import { LogsModule } from './logs/logs.module';
import { AlertasModule } from './alertas/alertas.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { UploadModule } from './upload/upload.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ColaboradoresModule,
    CategoriasModule,
    LojasModule,
    ProdutosModule,
    LogsModule,
    AlertasModule,
    DashboardModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // 🔐 Protege TODA a API por padrão (exceto rotas marcadas com @Public)
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Servir arquivos estáticos (imagens uploadadas)
  // Usar process.cwd() para garantir que o caminho seja relativo à raiz do projeto
  // mesmo quando compilado (__dirname aponta para dist/src quando compilado)
  const uploadsPath = join(process.cwd(), 'uploads');
  console.log('📁 Servindo arquivos estáticos de:', uploadsPath);
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads',
  });

  // Habilitar CORS
  app.enableCors({
    origin: 'http://localhost:4200', // Angular default port
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Filtro global de exceções
  app.useGlobalFilters(new HttpExceptionFilter());

  // Validação global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        const messages = errors.map((error) => ({
          field: error.property,
          message: Object.values(error.constraints || {}).join(', '),
        }));
        return new HttpException(
          {
            statusCode: 400,
            message: 'Erro de validação',
            errors: messages,
          },
          400,
        );
      },
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 API rodando na porta ${process.env.PORT ?? 3000}`);
}
bootstrap();

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLogDto } from './dto/create-log.dto';

@Injectable()
export class LogsService {
  constructor(private prisma: PrismaService) {}

  async create(createLogDto: CreateLogDto) {
    return this.prisma.log.create({
      data: createLogDto,
    });
  }

  async findAll(filters?: {
    usuarioId?: number;
    entidade?: string;
    tipo?: string;
    dataInicio?: Date;
    dataFim?: Date;
  }) {
    const where: any = {};

    if (filters?.usuarioId) {
      where.usuarioId = filters.usuarioId;
    }

    if (filters?.entidade) {
      where.entidade = filters.entidade;
    }

    if (filters?.tipo) {
      where.tipo = filters.tipo;
    }

    if (filters?.dataInicio || filters?.dataFim) {
      where.dataHora = {};
      if (filters.dataInicio) {
        where.dataHora.gte = filters.dataInicio;
      }
      if (filters.dataFim) {
        where.dataHora.lte = filters.dataFim;
      }
    }

    return this.prisma.log.findMany({
      where,
      orderBy: { dataHora: 'desc' },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    });
  }
}

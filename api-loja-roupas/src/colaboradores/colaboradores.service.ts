import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ColaboradoresService {
  constructor(private prisma: PrismaService) {}

  async findAll(email?: string) {
    if (email) {
      const colaborador = await this.prisma.colaborador.findUnique({
        where: { email },
      });
      return colaborador ? [colaborador] : [];
    }

    return this.prisma.colaborador.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        senha: true,
        status: true,
        cargo: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}

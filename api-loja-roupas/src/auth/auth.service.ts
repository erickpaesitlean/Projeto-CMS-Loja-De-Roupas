import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, senha } = loginDto;

    // Buscar colaborador por email
    const colaborador = await this.prisma.colaborador.findUnique({
      where: { email },
    });

    if (!colaborador) {
      throw new UnauthorizedException({
        success: false,
        message: 'Usuário não encontrado',
      });
    }

    // Verificar se está ativo
    if (colaborador.status !== 'ativo') {
      throw new UnauthorizedException({
        success: false,
        message: 'Usuário inativo',
      });
    }

    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, colaborador.senha);

    if (!senhaValida) {
      throw new UnauthorizedException({
        success: false,
        message: 'Senha inválida',
      });
    }

    // Gerar token JWT
    const payload = {
      sub: colaborador.id,
      email: colaborador.email,
      nome: colaborador.nome,
    };

    const token = this.jwtService.sign(payload);

    // Retornar dados do colaborador (sem senha) e token
    const { senha: _, ...colaboradorSemSenha } = colaborador;

    return {
      success: true,
      colaborador: colaboradorSemSenha,
      token,
    };
  }
}

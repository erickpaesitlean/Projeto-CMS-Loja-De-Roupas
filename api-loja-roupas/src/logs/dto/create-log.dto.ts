import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsInt,
} from 'class-validator';

export enum TipoLog {
  CREATE = 'create',
  EDIT = 'edit',
  UPDATE = 'update',
  DELETE = 'delete',
  INACTIVE = 'inactive',
  ACTIVE = 'active',
  MOVE = 'move',
}

export class CreateLogDto {
  @IsEnum(TipoLog, { message: 'Tipo deve ser um dos valores válidos' })
  @IsNotEmpty({ message: 'Tipo é obrigatório' })
  tipo: TipoLog | string;

  @IsString({ message: 'Entidade deve ser uma string' })
  @IsNotEmpty({ message: 'Entidade é obrigatória' })
  entidade: string;

  @IsString({ message: 'Descrição deve ser uma string' })
  @IsNotEmpty({ message: 'Descrição é obrigatória' })
  descricao: string;

  @IsOptional()
  @IsInt({ message: 'UsuarioId deve ser um número inteiro' })
  usuarioId?: number | null;

  @IsOptional()
  @IsString({ message: 'UsuarioNome deve ser uma string' })
  usuarioNome?: string | null;
}


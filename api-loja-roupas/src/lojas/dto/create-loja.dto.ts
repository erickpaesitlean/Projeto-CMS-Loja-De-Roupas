import {
  IsString,
  IsNotEmpty,
  MinLength,
  IsEnum,
  IsObject,
  ValidateIf,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum StoreType {
  FISICA = 'FISICA',
  ONLINE = 'ONLINE',
}

export enum StoreStatus {
  ATIVA = 'ATIVA',
  INATIVA = 'INATIVA',
}

export class EnderecoDto {
  @IsString({ message: 'Logradouro deve ser uma string' })
  @IsNotEmpty({ message: 'Logradouro é obrigatório' })
  logradouro: string;

  @IsString({ message: 'Número deve ser uma string' })
  @IsNotEmpty({ message: 'Número é obrigatório' })
  numero: string;

  @IsOptional()
  @IsString({ message: 'Complemento deve ser uma string' })
  complemento?: string;

  @IsString({ message: 'Bairro deve ser uma string' })
  @IsNotEmpty({ message: 'Bairro é obrigatório' })
  bairro: string;

  @IsString({ message: 'Cidade deve ser uma string' })
  @IsNotEmpty({ message: 'Cidade é obrigatória' })
  cidade: string;

  @IsString({ message: 'Estado deve ser uma string' })
  @IsNotEmpty({ message: 'Estado é obrigatório' })
  @MinLength(2, { message: 'Estado deve ter 2 caracteres' })
  estado: string;

  @IsString({ message: 'CEP deve ser uma string' })
  @IsNotEmpty({ message: 'CEP é obrigatório' })
  cep: string;
}

export class CreateLojaDto {
  @IsString({ message: 'Nome deve ser uma string' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MinLength(3, { message: 'Nome deve ter no mínimo 3 caracteres' })
  nome: string;

  @IsEnum(StoreType, { message: 'Tipo deve ser FISICA ou ONLINE' })
  @IsNotEmpty({ message: 'Tipo é obrigatório' })
  tipo: StoreType;

  @ValidateIf((o) => o.tipo === StoreType.FISICA)
  @IsObject({ message: 'Endereço deve ser um objeto' })
  @ValidateNested()
  @Type(() => EnderecoDto)
  endereco?: EnderecoDto | null;

  @IsString({ message: 'Horário de funcionamento deve ser uma string' })
  @IsNotEmpty({ message: 'Horário de funcionamento é obrigatório' })
  horarioFuncionamento: string;

  @IsEnum(StoreStatus, { message: 'Status deve ser ATIVA ou INATIVA' })
  @IsNotEmpty({ message: 'Status é obrigatório' })
  status: StoreStatus;
}

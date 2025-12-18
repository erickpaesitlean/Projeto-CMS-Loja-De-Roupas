import {
  IsString,
  IsNotEmpty,
  MinLength,
  IsOptional,
  IsInt,
  IsEnum,
  ValidateIf,
} from 'class-validator';

export enum CategoryStatus {
  ATIVA = 'ATIVA',
  INATIVA = 'INATIVA',
}

export class CreateCategoriaDto {
  @IsString({ message: 'Nome deve ser uma string' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MinLength(3, { message: 'Nome deve ter no mínimo 3 caracteres' })
  nome: string;

  @IsString({ message: 'Descrição deve ser uma string' })
  @IsNotEmpty({ message: 'Descrição é obrigatória' })
  @MinLength(10, { message: 'Descrição deve ter no mínimo 10 caracteres' })
  descricao: string;

  @IsOptional()
  @IsString({ message: 'Slug deve ser uma string' })
  slug?: string;

  @IsOptional()
  @ValidateIf((o) => o.categoriaPaiId !== null && o.categoriaPaiId !== undefined)
  @IsInt({ message: 'CategoriaPaiId deve ser um número inteiro' })
  categoriaPaiId?: number | null;

  @IsEnum(CategoryStatus, { message: 'Status deve ser ATIVA ou INATIVA' })
  @IsNotEmpty({ message: 'Status é obrigatório' })
  status: CategoryStatus;
}


import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoriaDto } from './create-categoria.dto';
import { IsOptional, ValidateIf, IsInt, IsString, MinLength, IsEnum } from 'class-validator';
import { CategoryStatus } from './create-categoria.dto';

export class UpdateCategoriaDto {
  @IsOptional()
  @IsString({ message: 'Nome deve ser uma string' })
  @MinLength(3, { message: 'Nome deve ter no mínimo 3 caracteres' })
  nome?: string;

  @IsOptional()
  @IsString({ message: 'Descrição deve ser uma string' })
  @MinLength(10, { message: 'Descrição deve ter no mínimo 10 caracteres' })
  descricao?: string;

  @IsOptional()
  @IsString({ message: 'Slug deve ser uma string' })
  slug?: string;

  @IsOptional()
  @ValidateIf((o) => o.categoriaPaiId !== null && o.categoriaPaiId !== undefined)
  @IsInt({ message: 'CategoriaPaiId deve ser um número inteiro' })
  categoriaPaiId?: number | null;

  @IsOptional()
  @IsEnum(CategoryStatus, { message: 'Status deve ser ATIVA ou INATIVA' })
  status?: CategoryStatus;
}


import {
  IsString,
  IsNotEmpty,
  MinLength,
  IsInt,
  IsNumber,
  Min,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
  IsOptional,
  IsEnum,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ProductStatus {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO',
}

class EstoquePorLojaDto {
  @IsInt({ message: 'LojaId deve ser um número inteiro' })
  @IsNotEmpty({ message: 'LojaId é obrigatório' })
  lojaId: number;

  @IsInt({ message: 'Quantidade deve ser um número inteiro' })
  @Min(0, { message: 'Quantidade não pode ser negativa' })
  quantidade: number;
}

export class CreateProdutoDto {
  @IsString({ message: 'Nome deve ser uma string' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MinLength(3, { message: 'Nome deve ter no mínimo 3 caracteres' })
  nome: string;

  @IsString({ message: 'Descrição deve ser uma string' })
  @IsNotEmpty({ message: 'Descrição é obrigatória' })
  @MinLength(10, { message: 'Descrição deve ter no mínimo 10 caracteres' })
  descricao: string;

  @IsInt({ message: 'CategoriaId deve ser um número inteiro' })
  @IsNotEmpty({ message: 'CategoriaId é obrigatório' })
  categoriaId: number;

  @IsNumber({}, { message: 'Preço deve ser um número' })
  @Min(0.01, { message: 'Preço deve ser maior que zero' })
  preco: number;

  @IsOptional()
  @IsNumber({}, { message: 'Preço promocional deve ser um número' })
  @ValidateIf((o) => o.precoPromocional !== null)
  @Min(0.01, { message: 'Preço promocional deve ser maior que zero' })
  precoPromocional?: number | null;

  @IsString({ message: 'SKU deve ser uma string' })
  @IsNotEmpty({ message: 'SKU é obrigatório' })
  sku: string;

  @IsString({ message: 'Código de barras deve ser uma string' })
  @IsNotEmpty({ message: 'Código de barras é obrigatório' })
  codigoBarras: string;

  @IsArray({ message: 'Tamanhos deve ser um array' })
  @IsString({ each: true, message: 'Cada tamanho deve ser uma string' })
  tamanhos: string[];

  @IsArray({ message: 'Cores deve ser um array' })
  @IsString({ each: true, message: 'Cada cor deve ser uma string' })
  cores: string[];

  @IsArray({ message: 'EstoquePorLoja deve ser um array' })
  @ValidateNested({ each: true })
  @Type(() => EstoquePorLojaDto)
  estoquePorLoja: EstoquePorLojaDto[];

  @IsArray({ message: 'Imagens deve ser um array' })
  @ArrayMinSize(1, { message: 'Pelo menos 1 imagem é obrigatória' })
  @ArrayMaxSize(8, { message: 'Máximo de 8 imagens permitidas' })
  @IsString({ each: true, message: 'Cada imagem deve ser uma URL válida' })
  imagens: string[];

  @IsEnum(ProductStatus, { message: 'Status deve ser ATIVO ou INATIVO' })
  @IsNotEmpty({ message: 'Status é obrigatório' })
  status: ProductStatus;
}

import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';

export enum TipoAlerta {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
}

export class CreateAlertaDto {
  @IsEnum(TipoAlerta, { message: 'Tipo deve ser info, warning ou error' })
  @IsNotEmpty({ message: 'Tipo é obrigatório' })
  tipo: TipoAlerta;

  @IsString({ message: 'Título deve ser uma string' })
  @IsNotEmpty({ message: 'Título é obrigatório' })
  titulo: string;

  @IsString({ message: 'Descrição deve ser uma string' })
  @IsNotEmpty({ message: 'Descrição é obrigatória' })
  descricao: string;
}


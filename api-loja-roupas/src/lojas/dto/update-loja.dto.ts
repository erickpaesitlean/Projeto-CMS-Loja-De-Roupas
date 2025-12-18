import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateLojaDto, EnderecoDto } from './create-loja.dto';

export class UpdateLojaDto extends PartialType(CreateLojaDto) {
  @IsOptional()
  @ValidateNested()
  @Type(() => EnderecoDto)
  endereco?: EnderecoDto | null;
}


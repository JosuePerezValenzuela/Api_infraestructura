/* eslint-disable indent */
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ListTipoBloquesQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La pagina debe ser un numero' })
  @Min(1, { message: 'La pagina debe ser un numero mayor o igual a 1' })
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El limite debe ser un numero' })
  @Min(1, { message: 'El limite debe ser un numero mayor o igual a 1' })
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'El search debe ser una cadena' })
  @MaxLength(64, { message: 'La busqueda no puede ser mayor a 64 caracteres' })
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(['nombre', 'descripcion', 'creado_en'], {
    message: 'Solo se puede ordenar por nombre, descripcion o creado_en',
  })
  orderBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(['asc', 'desc'], {
    message: 'La direccion de orden debe ser asc o desc',
  })
  orderDir?: string;
}

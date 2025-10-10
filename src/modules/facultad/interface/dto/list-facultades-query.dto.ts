/* eslint-disable indent */
import {
  IsInt,
  Min,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  IsIn,
} from 'class-validator';

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ListFacultadesQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La pagina debe ser entero' })
  @Min(1, { message: 'La pagina minima es 1' })
  page?: number = 1;

  @ApiPropertyOptional({ example: 8 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El limit debe ser entero' })
  @Min(1, { message: 'El valor minimo de limite es 1' })
  @Max(50, { message: 'El valor maximo de limit es 50' })
  limit?: number = 8;

  @ApiPropertyOptional({ example: 'tecnologia' })
  @IsOptional()
  @IsString({ message: 'La busqueda debe ser una cadena' })
  @MaxLength(256, { message: 'La busqueda maxima es de 256 caracteres' })
  search?: string;

  @ApiPropertyOptional({ example: 'nombre' })
  @IsOptional()
  @IsString({ message: 'El parametro por el cual ordenar debe ser una cadena' })
  @IsIn(['nombre', 'codigo', 'creado_en'], {
    message: 'Solo se puede por el nombre, codigo o creado_en',
  })
  orderBy?: 'nombre' | 'codigo' | 'creado_en' = 'nombre';

  @ApiPropertyOptional({ example: 'asc' })
  @IsOptional()
  @IsString({ message: 'El parametro para el orden debe ser una cadena' })
  @IsIn(['asc', 'desc'], {
    message: 'Solo se puede ordenar de forma asc o desc',
  })
  orderDir?: 'asc' | 'desc' = 'asc';
}

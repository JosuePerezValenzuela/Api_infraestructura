/* eslint-disable indent */
import {
  IsInt,
  Min,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  IsIn,
  IsBoolean,
} from 'class-validator';

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

const transformToBoolean = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return Boolean(value);
};

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
  @Max(200, { message: 'El valor maximo de limit es 200' })
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

  @ApiPropertyOptional({
    description: 'Filtra facultades activas o inactivas',
    example: true,
  })
  @IsOptional()
  @Transform(transformToBoolean)
  @IsBoolean({ message: 'activo debe ser booleano' })
  activo?: boolean;
}

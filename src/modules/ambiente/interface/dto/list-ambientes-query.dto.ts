/* eslint-disable indent */
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MaxLength,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import type {
  AmbienteListOrderBy,
  AmbienteListOrderDir,
} from '../../domain/ambiente.list.types';

const transformToBoolean = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();

    if (normalized === '') {
      return false;
    }

    if (normalized === 'true') {
      return true;
    }

    if (normalized === 'false') {
      return false;
    }
  }

  return Boolean(value);
};

export class ListAmbientesQueryDto {
  @ApiPropertyOptional({
    description: 'Número de página (base 1)',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt({ message: 'page debe ser un número entero' })
  @Min(1, { message: 'page debe ser mayor o igual a 1' })
  page?: number;

  @ApiPropertyOptional({
    description: 'Cantidad de registros por página',
    example: 8,
    minimum: 1,
    maximum: 50,
    default: 8,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt({ message: 'limit debe ser un número entero' })
  @Min(1, { message: 'limit debe ser mayor o igual a 1' })
  @Max(50, { message: 'limit no puede superar 50 elementos' })
  limit?: number;

  @ApiPropertyOptional({
    description: 'Texto para buscar por código, nombre o nombre corto',
    maxLength: 64,
    example: 'Laboratorio',
  })
  @IsOptional()
  @IsString({ message: 'search debe ser texto' })
  @MaxLength(64, { message: 'search no debe exceder 64 caracteres' })
  search?: string;

  @ApiPropertyOptional({
    description: 'Campo por el cual ordenar',
    enum: ['nombre', 'codigo', 'piso', 'activo', 'creado_en'],
    default: 'nombre',
  })
  @IsOptional()
  @IsIn(['nombre', 'codigo', 'piso', 'activo', 'creado_en'], {
    message: 'orderBy inválido',
  })
  orderBy?: AmbienteListOrderBy;

  @ApiPropertyOptional({
    description: 'Dirección del ordenamiento',
    enum: ['asc', 'desc'],
    default: 'asc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'], { message: 'orderDir solo puede ser asc o desc' })
  orderDir?: AmbienteListOrderDir;

  @ApiPropertyOptional({
    description: 'Filtro por bloque específico',
    example: 10,
    minimum: 1,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt({ message: 'bloqueId debe ser un entero positivo' })
  @Min(1, { message: 'bloqueId debe ser un entero positivo' })
  bloqueId?: number;

  @ApiPropertyOptional({
    description: 'Filtro por facultad (vía bloque)',
    example: 5,
    minimum: 1,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt({ message: 'facultadId debe ser un entero positivo' })
  @Min(1, { message: 'facultadId debe ser un entero positivo' })
  facultadId?: number;

  @ApiPropertyOptional({
    description: 'Filtro por tipo de ambiente',
    example: 3,
    minimum: 1,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt({ message: 'tipoAmbienteId debe ser un entero positivo' })
  @Min(1, { message: 'tipoAmbienteId debe ser un entero positivo' })
  tipoAmbienteId?: number;

  @ApiPropertyOptional({
    description: 'Filtra por ambientes activos o inactivos',
    example: true,
  })
  @Transform(transformToBoolean)
  @IsOptional()
  @IsBoolean({ message: 'activo debe ser booleano' })
  activo?: boolean;

  @ApiPropertyOptional({
    description: 'Filtra ambientes que permiten dictar clases',
    example: true,
  })
  @Transform(transformToBoolean)
  @IsOptional()
  @IsBoolean({ message: 'clases debe ser booleano' })
  clases?: boolean;

  @ApiPropertyOptional({
    description: 'Piso mínimo',
    example: 0,
    minimum: 0,
    maximum: 200,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt({ message: 'pisoMin debe ser un entero' })
  @Min(0, { message: 'pisoMin no puede ser menor a 0' })
  @Max(200, { message: 'pisoMin no puede ser mayor a 200' })
  pisoMin?: number;

  @ApiPropertyOptional({
    description: 'Piso máximo (limite superior 200)',
    example: 5,
    minimum: 0,
    maximum: 200,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt({ message: 'pisoMax debe ser un entero' })
  @Min(0, { message: 'pisoMax no puede ser menor a 0' })
  @Max(200, { message: 'pisoMax no puede ser mayor a 200' })
  pisoMax?: number;
}

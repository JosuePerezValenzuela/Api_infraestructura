import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import type {
  ActivoListOrderBy,
  ActivoListOrderDir,
} from '../../domain/activo.list.types';

// DTO para recibir y validar los filtros de listado de activos desde la API.
export class ListActivosQueryDto {
  @ApiPropertyOptional({
    description: 'Numero de pagina (base 1)',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt({ message: 'page debe ser un numero entero' })
  @Min(1, { message: 'page debe ser mayor o igual a 1' })
  page?: number;

  @ApiPropertyOptional({
    description: 'Cantidad de registros por pagina',
    example: 8,
    minimum: 1,
    maximum: 50,
    default: 8,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt({ message: 'limit debe ser un numero entero' })
  @Min(1, { message: 'limit debe ser mayor o igual a 1' })
  @Max(500, { message: 'limit no puede superar 500 elementos' })
  limit?: number;

  @ApiPropertyOptional({
    description: 'Texto para buscar por nia, nombre o descripcion',
    maxLength: 64,
    example: 'Proyector',
  })
  @IsOptional()
  @IsString({ message: 'search debe ser texto' })
  @MaxLength(64, { message: 'search no debe exceder 64 caracteres' })
  search?: string;

  @ApiPropertyOptional({
    description: 'Campo por el cual ordenar',
    enum: ['nia', 'nombre', 'creado_en'],
    default: 'nombre',
  })
  @IsOptional()
  @IsIn(['nia', 'nombre', 'creado_en'], { message: 'orderBy invalido' })
  orderBy?: ActivoListOrderBy;

  @ApiPropertyOptional({
    description: 'Direccion del ordenamiento',
    enum: ['asc', 'desc'],
    default: 'asc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'], { message: 'orderDir solo puede ser asc o desc' })
  orderDir?: ActivoListOrderDir;

  @ApiPropertyOptional({
    description: 'Filtra por ambiente especifico',
    example: 4,
    minimum: 1,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt({ message: 'ambienteId debe ser un entero positivo' })
  @Min(1, { message: 'ambienteId debe ser un entero positivo' })
  ambienteId?: number;
}

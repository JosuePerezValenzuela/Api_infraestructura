import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  Min,
  Max,
  IsString,
  MaxLength,
  IsBoolean,
  IsIn,
} from 'class-validator';

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

export class ListBloquesQueryDto {
  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La pagina debe ser un numero' })
  @Min(1, { message: 'La pagina debe ser un numero mayor o igual a 1' })
  page?: number;

  @ApiPropertyOptional({ example: 6, minimum: 1, maximum: 1000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El limite debe ser un numero' })
  @Min(1, {
    message: 'El limite debe ser un numero entre 1 y 1000 registros por pagina',
  })
  @Max(1000, {
    message: 'El limite debe ser un numero entre 1 y 1000 registros por pagina',
  })
  limit?: number;

  @ApiPropertyOptional({ example: 'Bloque' })
  @IsOptional()
  @IsString({ message: 'El search debe ser una cadena' })
  @MaxLength(64, { message: 'La busqueda no puede ser mayor a 64 caracteres' })
  search?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La facultadId debe ser un numero entero positivo' })
  @Min(1, { message: 'La facultadId debe ser un numero entero positivo' })
  facultadId?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El campusId debe ser un numero entero positivo' })
  @Min(1, { message: 'El campusId debe ser un numero entero positivo' })
  campusId?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El tipoBloqueId debe ser un numero entero positivo' })
  @Min(1, { message: 'El tipoBloqueId debe ser un numero entero positivo' })
  tipoBloqueId?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(transformToBoolean)
  @IsBoolean({ message: 'El activo debe ser un valor booleano' })
  activo?: boolean;

  @ApiPropertyOptional({ example: 1, maximum: 99 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El maximo numero de pisos es 99' })
  @Max(99, { message: 'El maximo numero de pisos es 99' })
  pisosMin?: number;

  @ApiPropertyOptional({ example: 1, maximum: 99 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El maximo numero de pisos es 99' })
  @Max(99, { message: 'El maximo numero de pisos es 99' })
  pisosMax?: number;

  @ApiPropertyOptional({ example: 'nombre' })
  @IsOptional()
  @IsString({ message: 'El orderBy debe ser una cadena' })
  @IsIn(['codigo', 'nombre', 'pisos', 'activo', 'creado_en'], {
    message:
      'Solo puedes ordenar por codigo, nombre, pisos, activo o creado_en',
  })
  orderBy?: string;

  @ApiPropertyOptional({ example: 'asc' })
  @IsOptional()
  @IsString({ message: 'El orderDir debe ser una cadena' })
  @IsIn(['asc', 'desc'], {
    message: 'La direccion de orden solo puede ser asc o desc',
  })
  orderDir?: string;
}

/* eslint-disable indent */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ListTipoAmbientesQueryDto {
  @ApiPropertyOptional({
    description: 'Número de página (>= 1)',
    default: 1,
  })
  @Type(() => Number)
  @IsInt({ message: 'La página debe ser un entero' })
  @Min(1, { message: 'La página debe ser un entero mayor o igual a 1' })
  @IsOptional()
  page = 1;

  @ApiPropertyOptional({
    description: 'Cantidad de registros a devolver (1..50)',
    default: 8,
  })
  @Type(() => Number)
  @IsInt({ message: 'El límite debe ser un entero' })
  @Min(1, { message: 'El límite debe ser un entero mayor o igual a 1' })
  @Max(50, { message: 'El límite máximo permitido es 50 registros' })
  @IsOptional()
  limit = 8;

  @ApiPropertyOptional({
    description: 'Búsqueda parcial por nombre',
    example: 'laboratorio',
  })
  @IsOptional()
  @IsString({ message: 'El término de búsqueda debe ser una cadena' })
  search?: string | null;

  @ApiPropertyOptional({
    description: 'Campo permitido para ordenar',
    enum: ['nombre', 'creado_en'],
    default: 'nombre',
  })
  @IsOptional()
  @IsIn(['nombre', 'creado_en'], {
    message: 'Solo puedes ordenar por nombre o creado_en',
  })
  orderBy: 'nombre' | 'creado_en' = 'nombre';

  @ApiPropertyOptional({
    description: 'Dirección de ordenamiento',
    enum: ['asc', 'desc'],
    default: 'asc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'], {
    message: 'Solo se aceptan las direcciones asc o desc',
  })
  orderDir: 'asc' | 'desc' = 'asc';
}

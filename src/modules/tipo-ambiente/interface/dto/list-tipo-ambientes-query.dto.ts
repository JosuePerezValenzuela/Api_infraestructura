import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

// Convierte valores de query como "true"/"false" a booleanos reales.
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
    description: 'Cantidad de registros a devolver (1..1000)',
    default: 8,
  })
  @Type(() => Number)
  @IsInt({ message: 'El límite debe ser un entero' })
  @Min(1, { message: 'El límite debe ser un entero mayor o igual a 1' })
  @Max(1000, { message: 'El límite máximo permitido es 1000 registros' })
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

  @ApiPropertyOptional({
    description: 'Filtra tipos de ambiente activos o inactivos',
    example: true,
  })
  @IsOptional()
  @Transform(transformToBoolean)
  @IsBoolean({ message: 'activo debe ser booleano' })
  activo?: boolean;
}

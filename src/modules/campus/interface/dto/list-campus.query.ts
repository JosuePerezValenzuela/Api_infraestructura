import {
  IsIn,
  IsInt,
  IsBoolean,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

const transformToBoolean = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return Boolean(value);
};

export class ListCampusQueryDto {
  // Pagina
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'pagina debe ser entero' })
  @Min(1, { message: 'pagina minimo es 1' })
  page: number = 1;

  //Limite de registros
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limite debe ser entero' })
  @Min(1, { message: 'limite minimo es 1' })
  @Max(1000, { message: 'limite maximo es 1000' })
  limit: number = 10;

  //Texto de busqueda para filtar
  @ApiPropertyOptional({ example: 'central' })
  @IsOptional()
  @IsString({ message: 'La busqueda debe ser texto' })
  @MaxLength(256, { message: 'La busqueda es demasiado largo' })
  search?: string;

  @ApiPropertyOptional({ example: 'nombre' })
  @IsOptional()
  @IsIn(['nombre', 'creado_en'], {
    message: 'Solo se puede ordenar por nombre y fecha de creacion',
  })
  orderBy: 'nombre' | 'creado_en' = 'creado_en';

  @ApiPropertyOptional({ example: 'asc' })
  @IsOptional()
  @IsIn(['asc', 'desc'], { message: 'asc o desc' })
  orderDir: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({
    description: 'Filtra campus activos o inactivos',
    example: true,
  })
  @IsOptional()
  @Transform(transformToBoolean)
  @IsBoolean({ message: 'activo debe ser booleano' })
  activo?: boolean;
}

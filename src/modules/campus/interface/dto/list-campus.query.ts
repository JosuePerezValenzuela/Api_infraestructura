/* eslint-disable indent */
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { Type } from 'class-transformer';

export class ListCampusQueryDto {
  // Pagina
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'pagina debe ser entero' })
  @Min(1, { message: 'pagina minimo es 1' })
  page: number = 1;

  //Limite de registros
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limite debe ser entero' })
  @Min(1, { message: 'limite minimo es 1' })
  @Max(100, { message: 'limite maximo es 100' })
  limit: number = 10;

  //Texto de busqueda para filtar
  @IsOptional()
  @IsString({ message: 'La busqueda debe ser texto' })
  @MaxLength(256, { message: 'La busqueda es demasiado largo' })
  search?: string;
}

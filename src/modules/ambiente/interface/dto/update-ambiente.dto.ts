import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

class UpdateCapacidadDto {
  @ApiPropertyOptional({ example: 40, minimum: 0 })
  @Type(() => Number)
  @IsInt({ message: 'capacidad.total debe ser un entero' })
  @Min(0, { message: 'capacidad.total debe ser >= 0' })
  total!: number;

  @ApiPropertyOptional({ example: 20, minimum: 0 })
  @Type(() => Number)
  @IsInt({ message: 'capacidad.examen debe ser un entero' })
  @Min(0, { message: 'capacidad.examen debe ser >= 0' })
  examen!: number;
}

class UpdateDimensionDto {
  @ApiPropertyOptional({ example: 9, minimum: 0 })
  @Type(() => Number)
  @Min(0, { message: 'dimension.largo debe ser >= 0' })
  largo!: number;

  @ApiPropertyOptional({ example: 4, minimum: 0 })
  @Type(() => Number)
  @Min(0, { message: 'dimension.ancho debe ser >= 0' })
  ancho!: number;

  @ApiPropertyOptional({ example: 3, minimum: 0 })
  @Type(() => Number)
  @Min(0, { message: 'dimension.alto debe ser >= 0' })
  alto!: number;

  @ApiPropertyOptional({
    example: 'metros',
    enum: ['metros'],
  })
  @IsString({ message: 'dimension.unid_med debe ser texto' })
  @IsIn(['metros'], {
    message: 'dimension.unid_med inválida',
  })
  unid_med!: 'metros';
}

export class UpdateAmbienteDto {
  @ApiPropertyOptional({ maxLength: 64, example: 'Laboratorio renovado' })
  @IsOptional()
  @IsString({ message: 'El nombre debe ser texto' })
  @MinLength(1, { message: 'El nombre no puede estar vacio' })
  @MaxLength(64, { message: 'El nombre no puede exceder 64 caracteres' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.trim();
    }
    return undefined;
  })
  nombre?: string;

  @ApiPropertyOptional({ maxLength: 16, example: 'LAB-REN' })
  @IsOptional()
  @IsString({ message: 'El codigo debe ser texto' })
  @MinLength(1, { message: 'El codigo no puede estar vacio' })
  @MaxLength(16, { message: 'El codigo no puede exceder 16 caracteres' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed;
    }
    if (value === null) {
      return null;
    }
    return undefined;
  })
  codigo?: string;

  @ApiPropertyOptional({ maxLength: 16, example: 'Lab' })
  @IsOptional()
  @IsString({ message: 'El nombre_corto debe ser texto' })
  @MaxLength(16, {
    message: 'El nombre_corto no puede exceder 16 caracteres',
  })
  nombre_corto?: string | null;

  @ApiPropertyOptional({ example: 2, minimum: -5, maximum: 200 })
  @Type(() => Number)
  @IsOptional()
  @IsInt({ message: 'El piso debe ser un entero' })
  @Min(-5, { message: 'El piso no puede ser menor a -5' })
  @Max(200, { message: 'El piso no puede ser mayor a 200' })
  piso?: number;

  @ApiPropertyOptional({ type: UpdateCapacidadDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateCapacidadDto)
  capacidad?: UpdateCapacidadDto;

  @ApiPropertyOptional({ type: UpdateDimensionDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateDimensionDto)
  dimension?: UpdateDimensionDto;

  @ApiPropertyOptional({ example: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const lower = value.trim().toLowerCase();
      if (lower === 'true') return true;
      if (lower === 'false') return false;
      return undefined;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    return undefined;
  })
  @IsOptional()
  @IsBoolean({ message: 'clases debe ser booleano' })
  clases?: boolean;

  @ApiPropertyOptional({ example: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const lower = value.trim().toLowerCase();
      if (lower === 'true') return true;
      if (lower === 'false') return false;
      return undefined;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    return undefined;
  })
  @IsOptional()
  @IsBoolean({ message: 'activo debe ser booleano' })
  activo?: boolean;

  @ApiPropertyOptional({ example: 5, minimum: 1 })
  @Type(() => Number)
  @IsOptional()
  @IsInt({ message: 'tipo_ambiente_id debe ser un entero' })
  @Min(1, { message: 'tipo_ambiente_id debe ser positivo' })
  tipo_ambiente_id?: number;

  @ApiPropertyOptional({ example: 8, minimum: 1 })
  @Type(() => Number)
  @IsOptional()
  @IsInt({ message: 'bloque_id debe ser un entero' })
  @Min(1, { message: 'bloque_id debe ser positivo' })
  bloque_id?: number;
}

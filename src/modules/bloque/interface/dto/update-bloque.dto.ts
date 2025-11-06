/* eslint-disable indent */

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  Max,
  MaxLength,
  Validate,
  IsBoolean,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Type } from 'class-transformer';

// Validador para que lat y lng lleguen juntos o ambos se omitan
@ValidatorConstraint({ name: 'LatLngPair', async: false })
class LatLngPair implements ValidatorConstraintInterface {
  validate(_: number | undefined, args: ValidationArguments): boolean {
    const { lat, lng } = args.object as UpdateBloqueDto;
    const hasLat = lat !== undefined && lat !== null;
    const hasLng = lng !== undefined && lng !== null;
    return (hasLat && hasLng) || (!hasLat && !hasLng);
  }

  defaultMessage(): string {
    return 'Debes enviar lat y lng juntos';
  }
}

export class UpdateBloqueDto {
  @ApiPropertyOptional({
    description: 'Codigo unico del bloque',
    maxLength: 16,
    example: 'BLOQUE-101',
  })
  @IsOptional()
  @IsString({ message: 'El codigo debe ser una cadena ' })
  @IsNotEmpty({ message: 'El codigo no puede estar vacio' })
  @MaxLength(16, { message: 'El codigo no debe exceder los 16 caracteres' })
  codigo?: string;

  @ApiPropertyOptional({
    description: 'Nombre completo del bloque',
    maxLength: 128,
    example: 'Bloque central de Tecnologia',
  })
  @IsOptional()
  @IsString({ message: 'El Nombre debe ser una cadena' })
  @IsNotEmpty({ message: 'El nombre no puede estar vacio' })
  @MaxLength(128, { message: 'El nombre no debe exceder los 128 caracteres' })
  nombre?: string;

  @ApiPropertyOptional({
    description: 'Nombre_corto',
    maxLength: 16,
    example: 'Bloque Tecno',
  })
  @IsOptional()
  @IsString({ message: 'El nombre_corto debe ser una cadena' })
  @IsNotEmpty({ message: 'El nombre_corto no puede estar vacio' })
  @MaxLength(16, {
    message: 'El nombre_corto no debe exceder los 16 caracteres',
  })
  nombre_corto?: string;

  @ApiPropertyOptional({
    description: 'Cantidad de pisos',
    minimum: 1,
    maximum: 99,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Los pisos deben ser un entero entre 1 y 99' })
  @Min(1, { message: 'Los pisos deben ser un entero entre 1 y 99' })
  @Max(99, { message: 'Los pisos deben ser un entero entre 1 y 99' })
  pisos?: number;

  @ApiPropertyOptional({
    description: 'Latitud (debe acompañar a lng)',
    minimum: 1,
    maximum: 99,
    example: -17.3937,
  })
  @IsOptional()
  @Type(() => Number)
  @Validate(LatLngPair)
  @Min(-90, { message: 'La latidud debe estar entre -90 y 90' })
  @Max(90, { message: 'La latitud debe estar entre -90 y 90' })
  lat?: number;

  @ApiPropertyOptional({
    description: 'Longitud (debe acompañar a lat)',
    minimum: -180,
    maximum: 180,
    example: -66.1568,
  })
  @IsOptional()
  @Type(() => Number)
  @Validate(LatLngPair)
  @Min(-180, { message: 'La longitud debe estar entre -180 y 180' })
  @Max(180, { message: 'La longitud debe estar entre -180 y 180' })
  lng?: number;

  @ApiPropertyOptional({
    description: 'Indica si el bloque esta activo',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'El campo activo debe ser booleano' })
  activo?: boolean;

  @ApiPropertyOptional({
    description: 'Facultad asociada (entero positivo)',
    minimum: 1,
    example: 2,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({
    message: 'La facultad indicada debe ser un numero entero positivo ',
  })
  @Min(1, {
    message: 'La facultad indicada debe ser un numero entero positivo',
  })
  facultad_id?: number;

  @ApiPropertyOptional({
    description: 'Tipo de bloque asociado (entero positivo)',
    minimum: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({
    message: 'El tipo de bloque indicado debe ser un numero entero positivo ',
  })
  @Min(1, {
    message: 'El tipo de bloque indicado debe ser un numero entero positivo',
  })
  tipo_bloque_id?: number;
}

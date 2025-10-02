/* eslint-disable indent */
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MaxLength,
  Validate,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

/**
 * Si se envia lat tambien se debe enviar lng y viceversa
 */

type WithLatLng = { lat?: number | null; lng?: number | null };

@ValidatorConstraint({ name: 'LatLngPair', async: false })
class LatLngPair implements ValidatorConstraintInterface {
  validate(_: number | undefined, args: ValidationArguments): boolean {
    const o = args.object as WithLatLng;
    const hasLat = o.lat !== undefined && o.lat !== null;
    const hasLng = o.lng !== undefined && o.lng !== null;
    return (hasLat && hasLng) || (!hasLat && !hasLng);
  }
  defaultMessage(): string {
    return 'Si se envia lat tambien se debe enviar lng y viceversa';
  }
}

export class UpdateCampusDto {
  @ApiPropertyOptional({
    description: 'Codigo del campus',
    maxLength: 16,
    example: '123456789',
  })
  @IsOptional()
  @IsString({ message: 'El codigo debe ser una cadena' })
  @MaxLength(16, { message: 'El codigo no debe exceder de 16 caracteres' })
  @MinLength(1, { message: 'El codigo debe tener al menos 1 caracteres' })
  codigo?: string;

  @ApiPropertyOptional({
    description: 'Nombre del campus',
    maxLength: 128,
    example: 'Campus Central',
  })
  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena' })
  @MaxLength(128, { message: 'El nombre no debe exceder de 128 caracteres' })
  @MinLength(1, { message: 'El nombre debe tener al menos 1 caracteres' })
  nombre?: string;

  @ApiPropertyOptional({
    description: 'Direccion del campus',
    maxLength: 256,
    example: 'Avenida sucre entre belzu y oquendo',
  })
  @IsOptional()
  @IsString({ message: 'La direccion debe ser una cadena' })
  @MaxLength(256, {
    message: 'La direccion no puede exceder los 256 caracteres',
  })
  @MinLength(1, { message: 'La direccion debe tener al menos 3 caracteres' })
  direccion?: string;

  @ApiPropertyOptional({
    description: 'Latitud del campus',
    minimum: -90,
    maximum: 90,
    example: -17.393178,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'La latitud debe ser un numero' })
  @Min(-90, { message: 'La latitud no puede ser menor a -90' })
  @Max(90, { message: 'La latitud no puede ser mayor a 90' })
  @Validate(LatLngPair)
  lat?: number;

  @ApiPropertyOptional({
    description: 'Longitud del campus',
    minimum: -180,
    maximum: 180,
    example: -66.157389,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'La longitud debe ser un numero' })
  @Max(180, { message: 'La longitud no puede ser mayor a 180' })
  @Min(-180, { message: 'La longitud no puede ser menor a -180' })
  @Validate(LatLngPair)
  lng?: number;

  @ApiPropertyOptional({
    description: 'Indica si el campus esta activo',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'El estado activo debe ser booleano' })
  activo?: boolean;
}

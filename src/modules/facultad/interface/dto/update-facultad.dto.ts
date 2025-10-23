/* eslint-disable indent */

import { ApiPropertyOptional } from '@nestjs/swagger';

import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Max,
  Min,
  IsNumber,
  Validate,
  IsBoolean,
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

export class UpdateFacultadesDto {
  @ApiPropertyOptional({
    description: 'Codigo de la UMSS para la facultad',
    maxLength: 16,
    minLength: 1,
    example: '1234554321',
  })
  @IsOptional()
  @IsString({ message: 'El codigo de la facultad debe ser una cadena' })
  @MaxLength(16, {
    message: 'El tamaño del codigo debe ser maximo de 16 caracteres',
  })
  @MinLength(1, {
    message: 'El tamaño del codigo debe ser minimo de 1 caracter',
  })
  codigo?: string;

  @ApiPropertyOptional({
    description: 'Nombre de la facultad',
    maxLength: 128,
    minLength: 1,
    example: 'Facultad de ciencias y tecnologa ',
  })
  @IsOptional()
  @IsString({ message: 'El nombre de la facultad debe ser una cadena' })
  @MaxLength(128, {
    message: 'El nombre de la facultad debe ser maximo de 128 caracteres',
  })
  @MinLength(1, {
    message: 'El nombre de la facultad debe terner minimo 1 caracter',
  })
  nombre?: string;

  @ApiPropertyOptional({
    description: 'Nombre corto para una facultad',
    maxLength: 16,
    minLength: 1,
    example: 'FCyT',
  })
  @IsOptional()
  @IsString({ message: 'El nombre corto debe ser una cadena' })
  @MaxLength(16, { message: 'El nombre corto maximo debe tener 16 caracteres' })
  @MinLength(1, {
    message: 'El nombre corto minimo debe tener minimo 1 caracter',
  })
  nombre_corto?: string;

  @ApiPropertyOptional({
    description: 'Latitud de la facultad',
    minimum: -90,
    maximum: 90,
    example: -17.393178,
  })
  @IsOptional()
  @IsNumber({}, { message: 'La latitud debe ser un numero' })
  @Max(90, { message: 'La latitud no puede ser mayor a 90' })
  @Min(-90, { message: 'La latitud no puede ser menor a -90' })
  @Validate(LatLngPair)
  lat?: number;

  @ApiPropertyOptional({
    description: 'Longitud de la facultad',
    minimum: -180,
    maximum: 180,
    example: -17.393178,
  })
  @IsOptional()
  @IsNumber({}, { message: 'La longitud debe ser un numero' })
  @Max(90, { message: 'La longitud no puede ser mayor a 90' })
  @Min(-90, { message: 'La longitud no puede ser menor a -90' })
  @Validate(LatLngPair)
  lng?: number;

  @ApiPropertyOptional({
    description: 'Indica el estado de la facultad',
    example: 'true',
  })
  @IsOptional()
  @IsBoolean({ message: 'El parametro activo debe ser boolean' })
  activo?: boolean;

  @ApiPropertyOptional({
    description: 'El codigo del campus al que pertenece esta facultad',
    minimum: 1,
    example: 7,
  })
  @IsOptional()
  @IsNumber({}, { message: 'El campus_id debe ser numerico' })
  @Min(1, { message: 'El valor minimo para campus_id es 1' })
  campus_id: number;
}

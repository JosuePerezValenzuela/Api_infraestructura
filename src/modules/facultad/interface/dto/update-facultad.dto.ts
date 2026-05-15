import { ApiPropertyOptional } from '@nestjs/swagger';

import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  IsNumber,
  IsBoolean,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';

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
    description: 'Indica el estado de la facultad',
    example: 'true',
  })
  @IsOptional()
  @IsBoolean({ message: 'El parametro activo debe ser boolean' })
  activo?: boolean;

  @ApiPropertyOptional({
    description: 'Lista de IDs de campus donde estará la facultad',
    type: [Number],
    example: [1, 2],
  })
  @IsOptional()
  @IsArray({ message: 'El campo campus_ids debe ser un array' })
  @ArrayMinSize(1, { message: 'Debe indicar al menos un campus' })
  @ArrayMaxSize(10, { message: 'No puede tener más de 10 campus' })
  @IsNumber({}, { message: 'Cada campus_id debe ser numerico', each: true })
  campus_ids?: number[];
}
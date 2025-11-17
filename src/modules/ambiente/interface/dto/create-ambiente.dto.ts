/* eslint-disable indent */
import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDefined,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class CapacidadDto {
  @ApiProperty({
    description: 'Cantidad total de personas que entran en el ambiente',
    example: 40,
    minimum: 0,
  })
  @Type(() => Number)
  @IsInt({ message: 'capacidad.total debe ser un numero entero' })
  @Min(0, { message: 'capacidad.total debe ser mayor o igual a 0' })
  total!: number;

  @ApiProperty({
    description: 'Cantidad de personas en modo examen',
    example: 25,
    minimum: 0,
  })
  @Type(() => Number)
  @IsInt({ message: 'capacidad.examen debe ser un numero entero' })
  @Min(0, { message: 'capacidad.examen debe ser mayor o igual a 0' })
  examen!: number;
}

class DimensionDto {
  @ApiProperty({
    description: 'Largo del ambiente en unidades seleccionadas',
    example: 8.5,
    minimum: 0,
  })
  @Type(() => Number)
  @Min(0, { message: 'dimension.largo debe ser mayor o igual a 0' })
  largo!: number;

  @ApiProperty({
    description: 'Ancho del ambiente',
    example: 6.1,
    minimum: 0,
  })
  @Type(() => Number)
  @Min(0, { message: 'dimension.ancho debe ser mayor o igual a 0' })
  ancho!: number;

  @ApiProperty({
    description: 'Altura del ambiente',
    example: 3.2,
    minimum: 0,
  })
  @Type(() => Number)
  @Min(0, { message: 'dimension.alto debe ser mayor o igual a 0' })
  alto!: number;

  @ApiProperty({
    description: 'Unidad de medida usada para largo/ancho/alto',
    example: 'metros',
    enum: ['metros'],
  })
  @IsString({ message: 'dimension.unid_med debe ser una cadena' })
  @IsIn(['metros'], {
    message: 'dimension.unid_med debe ser metros, centimetros o milimetros',
  })
  unid_med!: 'metros';
}

export class CreateAmbienteDto {
  @ApiProperty({
    description: 'Nombre descriptivo del ambiente',
    maxLength: 64,
    example: 'Laboratorio de Software',
  })
  @IsDefined({ message: 'El nombre es obligatorio' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre no puede estar vacio' })
  @MaxLength(64, { message: 'El nombre no debe exceder los 64 caracteres' })
  nombre!: string;

  @ApiProperty({
    description: 'Nombre corto opcional para listados',
    maxLength: 16,
    required: false,
    example: 'Lab soft',
  })
  @IsOptional()
  @IsString({ message: 'El nombre_corto debe ser una cadena de texto' })
  @MaxLength(16, {
    message: 'El nombre_corto no debe exceder los 16 caracteres',
  })
  nombre_corto?: string;

  @ApiProperty({
    description: 'Codigo unico del ambiente dentro de la institucion',
    maxLength: 16,
    example: 'LAB-SOFT-01',
  })
  @IsDefined({ message: 'El codigo es obligatorio' })
  @IsString({ message: 'El codigo debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El codigo no puede estar vacio' })
  @MaxLength(16, {
    message: 'El codigo no debe exceder los 16 caracteres',
  })
  codigo!: string;

  @ApiProperty({
    description: 'Piso en el que se encuentra el ambiente',
    example: 2,
    minimum: -5,
    maximum: 200,
  })
  @Type(() => Number)
  @IsDefined({ message: 'El piso es obligatorio' })
  @IsInt({ message: 'El piso debe ser un numero entero' })
  @Min(-5, { message: 'El piso minimo permitido es -5' })
  @Max(200, { message: 'El piso maximo permitido es 200' })
  piso!: number;

  @ApiProperty({
    description: 'Capacidad declarada del ambiente',
    required: false,
    type: CapacidadDto,
    example: { total: 40, examen: 25 },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CapacidadDto)
  capacidad?: CapacidadDto;

  @ApiProperty({
    description: 'Dimensiones fisicas del ambiente',
    required: false,
    type: DimensionDto,
    example: {
      largo: 8.5,
      ancho: 6.1,
      alto: 3.2,
      unid_med: 'metros',
    },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DimensionDto)
  dimension?: DimensionDto;

  @ApiProperty({
    description: 'Indica si el ambiente puede utilizarse como aula',
    example: true,
  })
  @IsDefined({ message: 'El campo clases es obligatorio' })
  @IsBoolean({ message: 'El campo clases debe ser booleano' })
  clases!: boolean;

  @ApiProperty({
    description: 'Permite desactivar el ambiente durante su creacion',
    required: false,
    default: true,
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'El campo activo debe ser booleano' })
  activo?: boolean;

  @ApiProperty({
    description: 'Identificador del tipo de ambiente',
    example: 5,
    minimum: 1,
  })
  @Type(() => Number)
  @IsDefined({ message: 'El tipo de ambiente es obligatorio' })
  @IsInt({
    message: 'El tipo de ambiente debe ser un numero entero positivo',
  })
  @Min(1, {
    message: 'El tipo de ambiente debe ser un numero entero positivo',
  })
  tipo_ambiente_id!: number;

  @ApiProperty({
    description: 'Identificador del bloque al que pertenece',
    example: 8,
    minimum: 1,
  })
  @Type(() => Number)
  @IsDefined({ message: 'El bloque es obligatorio' })
  @IsInt({ message: 'El bloque debe ser un numero entero positivo' })
  @Min(1, { message: 'El bloque debe ser un numero entero positivo' })
  bloque_id!: number;
}

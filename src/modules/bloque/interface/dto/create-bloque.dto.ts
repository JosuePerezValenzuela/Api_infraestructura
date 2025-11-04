/* eslint-disable indent */
import { ApiProperty } from '@nestjs/swagger';
import {
  IsDefined,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  Max,
  ValidateIf,
  IsInt,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBloqueDto {
  @ApiProperty({ example: 'BLOQ001', maxLength: 16 })
  @IsDefined({ message: 'El codigo es obligatorio' })
  @IsString({ message: 'El codigo debe ser una cadena' })
  @IsNotEmpty({ message: 'El codigo no puede estar vacio' })
  @MaxLength(16, { message: 'El codigo no debe exceder los 16 caracteres' })
  codigo!: string;

  @ApiProperty({ example: 'Bloque de aulas A', maxLength: 128 })
  @IsDefined({ message: 'El nombre es obligatorio' })
  @IsString({ message: 'El nombre debe ser una cadena' })
  @IsNotEmpty({ message: 'El nombre no puede estar vacio' })
  @MaxLength(128, { message: 'El nombre no debe exceder los 128 caracteres' })
  nombre!: string;

  @ApiProperty({ example: 'Bloque A', maxLength: 16 })
  @IsOptional()
  @IsString({ message: 'El nombre corto debe ser una cadena' })
  @MaxLength(16, {
    message: 'El nombre_corto no debe exceder los 16 caracteres',
  })
  nombre_corto?: string;

  @ApiProperty({ example: '-17.3937' })
  @Type(() => Number)
  @ValidateIf((obj: CreateBloqueDto) => obj.lng !== undefined)
  @IsDefined({ message: 'Debes enviar lat y lng al mismo tiempo' })
  @Min(-90, { message: 'La latitud debe estar entre -90 y 90' })
  @Max(90, { message: 'La latitud debe estar entre -90 y 90' })
  lat!: number;

  @ApiProperty({ example: '-17.3937' })
  @Type(() => Number)
  @ValidateIf((obj: CreateBloqueDto) => obj.lat !== undefined)
  @IsDefined({ message: 'Debes enviar lat y lng al mismo tiempo' })
  @Min(-180, { message: 'La longitud debe estar entre -180 y 180' })
  @Max(180, { message: 'La longitud debe estar entre -180 y 180' })
  lng!: number;

  @ApiProperty({ example: 3 })
  @Type(() => Number)
  @IsDefined({ message: 'Los pisos deben ser un entero entre 1 y 99' })
  @IsInt({ message: 'Los pisos deben ser un entero entre 1 y 99' })
  @Min(1, { message: 'Los pisos deben ser un entero entre 1 y 99' })
  @Max(99, { message: 'Los pisos deben ser un entero entre 1 y 99' })
  pisos!: number;

  @ApiProperty({ example: true, default: true, required: false })
  @IsOptional()
  @IsBoolean({ message: 'El campo activo debe ser booleano' })
  activo?: boolean;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsDefined({
    message: 'La facultad asociada debe ser un numero entero positivo',
  })
  @IsInt({ message: 'La facultad asociada debe ser un numero entero positivo' })
  @Min(1, {
    message: 'La facultad asociada debe ser un numero entero positivo',
  })
  facultad_id!: number;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsDefined({
    message: 'El tipo de bloque asociado debe ser un numero entero positivo',
  })
  @IsInt({
    message: 'El tipo de bloque asociado debe ser un numero entero positivo',
  })
  @Min(1, {
    message: 'El tipo de bloque asociado debe ser un numero entero positivo',
  })
  tipo_bloque_id!: number;
}

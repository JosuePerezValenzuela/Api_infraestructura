/* eslint-disable indent */
import {
  IsDefined,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFacultadDto {
  @ApiProperty({ example: '12345', maxLength: 16 })
  @IsDefined({ message: 'No se ingreso el campo codigo' })
  @IsNotEmpty({ message: 'El codigo no puede estar vacio' })
  @IsString({ message: 'El codigo debe ser una cadena' })
  @MaxLength(16, { message: 'El codigo no debe exceder los 16 caracteres' })
  codigo!: string;

  @ApiProperty({ example: 'Facultad de ciencias y tecnologia', maxLength: 128 })
  @IsDefined({ message: 'No se ingreso el campo nombre' })
  @IsNotEmpty({ message: 'El nombre no puede estar vacio' })
  @IsString({ message: 'El nombre debe ser una cadena' })
  @MaxLength(128, { message: 'El nombre no debe exceder los 128 caracteres' })
  nombre!: string;

  @ApiPropertyOptional({
    description: 'Nombre corto de la facultad',
    maxLength: 16,
    example: 'FCyT',
  })
  @IsOptional()
  @IsString({ message: 'El nombre corto debe ser una cadena' })
  @MaxLength(16, {
    message: 'El nombre corto no debe exceder los 16 caracteres',
  })
  nombre_corto?: string | null;

  @ApiProperty({ example: -14.3935, description: 'Latitud (y)' })
  @IsDefined({ message: 'No se ingreso la latitud' })
  @IsNotEmpty({ message: 'El campo latitud no puede estar vacio' })
  @IsNumber({}, { message: 'La latitud debe ser numerico' })
  lat!: number;

  @ApiProperty({ example: -66.157, description: 'Longitud (x)' })
  @IsDefined({ message: 'No se ingreso la longitud' })
  @IsNotEmpty({ message: 'El campo longitud no puede estar vacio' })
  @IsNumber({}, { message: 'La longitud debe ser numerico' })
  lng!: number;

  @ApiProperty({ example: 1, description: 'Codigo asociado a un campus' })
  @IsDefined({ message: 'No se ingreso el campus_id' })
  @IsNotEmpty({ message: 'El campus_id no puede estar vacio' })
  @IsNumber({}, { message: 'El campus_id debe ser numerico' })
  campus_id!: number;
}

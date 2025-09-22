/* eslint-disable indent */
import {
  IsDefined,
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
export class CreateCampusDto {
  @ApiProperty({ example: 'Campus Central', maxLength: 128 })
  @IsDefined({ message: 'No se ingreso el campo nombre' })
  @IsNotEmpty({ message: 'El nombre no puede ser vacio' })
  @IsString({ message: 'El nombre debe ser una cadena' })
  @MaxLength(128, { message: 'El nombre no debe exceder de 128 caracteres' })
  nombre!: string;

  @ApiProperty({
    example: 'Avenida sucre entre belzu y oquendo',
    maxLength: 256,
  })
  @IsDefined({ message: 'No se ingreso el campo direccion' })
  @IsString({ message: 'La direccion debe ser una cadena' })
  @IsNotEmpty({ message: 'La direccion no puede estar vacia' })
  @MaxLength(256, {
    message: 'La direccion no puede exceder los 256 caracteres',
  })
  direccion!: string;

  @ApiProperty({ example: -17.3935, description: 'Latitud (y)' })
  @IsDefined({ message: 'No se ingreso el campo lat (latitud para el Point)' })
  @IsNotEmpty({ message: 'El campo lat no puede estar vacio' })
  @Type(() => Number)
  @IsNumber({}, { message: 'La lat debe ser numerico' })
  lat!: number;

  @ApiProperty({ example: -66.157, description: 'Longitud (x)' })
  @IsDefined({ message: 'No se ingreso el campo lng (Longitud para el Point' })
  @IsNotEmpty({ message: 'El campo lng no puede estar vacio' })
  @Type(() => Number)
  @IsNumber({}, { message: 'La lng debe ser numerico' })
  lng!: number;
}

/* eslint-disable indent */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTipoAmbienteDto {
  @ApiProperty({
    description:
      'Nombre del tipo de ambiente, por ejemplo Aula de clases o Laboratorio',
    maxLength: 64,
    example: 'Laboratorio de física',
  })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre no puede estar vacío' })
  @MaxLength(64, { message: 'El nombre no debe exceder los 64 caracteres' })
  nombre!: string;

  @ApiProperty({
    description: 'Descripción detallada del tipo de ambiente para guiar su uso',
    maxLength: 256,
    example: 'Espacio equipado para experimentos de física',
  })
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La descripción no puede estar vacía' })
  @MaxLength(256, {
    message: 'La descripción no debe exceder los 256 caracteres',
  })
  descripcion!: string;

  @ApiProperty({
    description: 'Descripción corta opcional para mostrar en listados',
    maxLength: 32,
    required: false,
    example: 'Lab física',
  })
  @IsOptional()
  @IsString({
    message: 'La descripción corta debe ser una cadena de texto',
  })
  @MaxLength(32, {
    message: 'La descripción corta no debe exceder los 32 caracteres',
  })
  descripcion_corta?: string;
}

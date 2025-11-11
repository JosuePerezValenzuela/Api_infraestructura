/* eslint-disable indent */
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateTipoAmbienteDto {
  @ApiPropertyOptional({
    description: 'Nombre del tipo de ambiente (1..64 caracteres)',
    maxLength: 64,
    example: 'Laboratorio clínico',
  })
  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena' })
  @MinLength(1, { message: 'El nombre no puede estar vacío' })
  @MaxLength(64, { message: 'El nombre no debe exceder los 64 caracteres' })
  nombre?: string;

  @ApiPropertyOptional({
    description: 'Descripción detallada (1..256 caracteres)',
    maxLength: 256,
    example: 'Espacio destinado a prácticas científicas',
  })
  @IsOptional()
  @IsString({ message: 'La descripción debe ser una cadena' })
  @MinLength(1, { message: 'La descripción no puede estar vacía' })
  @MaxLength(256, {
    message: 'La descripción no debe exceder los 256 caracteres',
  })
  descripcion?: string;

  @ApiPropertyOptional({
    description: 'Descripción corta opcional (<=32 caracteres)',
    maxLength: 32,
    example: 'Lab clínico',
  })
  @IsOptional()
  @IsString({ message: 'La descripción corta debe ser una cadena' })
  @MaxLength(32, {
    message: 'La descripción corta no debe exceder los 32 caracteres',
  })
  descripcion_corta?: string | null;

  @ApiPropertyOptional({
    description: 'Estado del tipo de ambiente',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'El campo activo debe ser booleano' })
  activo?: boolean;
}

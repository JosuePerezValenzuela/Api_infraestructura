import {
  IsDefined,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
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

  @ApiProperty({
    description: 'Lista de IDs de campus donde estará la facultad',
    type: [Number],
    example: [1, 2],
  })
  @IsDefined({ message: 'No se ingreso el campo campus_ids' })
  @IsArray({ message: 'El campo campus_ids debe ser un array' })
  @ArrayMinSize(1, { message: 'Debe indicar al menos un campus' })
  @ArrayMaxSize(10, { message: 'No puede tener más de 10 campus' })
  @IsNumber({}, { message: 'Cada campus_id debe ser numerico', each: true })
  campus_ids!: number[];
}

/* eslint-disable indent */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

// DTO para validar la creacion de un activo.
export class CreateActivoDto {
  @ApiProperty({
    description: 'Identificador unico del activo (NIA)',
    maxLength: 32,
    example: 'NIA-0001',
  })
  @IsString({ message: 'nia debe ser texto' })
  @IsNotEmpty({ message: 'nia no puede estar vacio' })
  @MaxLength(32, { message: 'nia no debe exceder 32 caracteres' })
  nia!: string;

  @ApiProperty({
    description: 'Nombre del activo',
    maxLength: 32,
    example: 'Proyector Epson X12',
  })
  @IsString({ message: 'nombre debe ser texto' })
  @IsNotEmpty({ message: 'nombre no puede estar vacio' })
  @MaxLength(32, { message: 'nombre no debe exceder 32 caracteres' })
  nombre!: string;

  @ApiPropertyOptional({
    description: 'Descripcion breve del activo',
    maxLength: 128,
    example: 'Proyector principal del auditorio central',
  })
  @IsOptional()
  @IsString({ message: 'descripcion debe ser texto' })
  @MaxLength(128, { message: 'descripcion no debe exceder 128 caracteres' })
  descripcion?: string;

  @ApiPropertyOptional({
    description: 'Ambiente donde se encuentra el activo',
    example: 4,
    minimum: 1,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt({ message: 'ambiente_id debe ser un entero positivo' })
  @Min(1, { message: 'ambiente_id debe ser un entero positivo' })
  @Max(1000000, { message: 'ambiente_id no debe ser tan grande' })
  ambiente_id?: number;
}

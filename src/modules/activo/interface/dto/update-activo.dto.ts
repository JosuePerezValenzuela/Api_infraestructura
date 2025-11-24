import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

// DTO para validar los campos de actualizacion de un activo.
export class UpdateActivoDto {
  @ApiPropertyOptional({
    description: 'Nuevo NIA del activo (max 32 caracteres)',
    maxLength: 32,
    example: 'NIA-0002',
  })
  @IsOptional()
  @IsString({ message: 'nia debe ser texto' })
  @MaxLength(32, { message: 'nia no debe exceder 32 caracteres' })
  nia?: string;

  @ApiPropertyOptional({
    description: 'Nombre del activo (max 32 caracteres)',
    maxLength: 32,
    example: 'Router Cisco 2900',
  })
  @IsOptional()
  @IsString({ message: 'nombre debe ser texto' })
  @MaxLength(32, { message: 'nombre no debe exceder 32 caracteres' })
  nombre?: string;

  @ApiPropertyOptional({
    description: 'Descripcion breve (max 128 caracteres)',
    maxLength: 128,
    example: 'Router principal del laboratorio de redes',
  })
  @IsOptional()
  @IsString({ message: 'descripcion debe ser texto' })
  @MaxLength(128, { message: 'descripcion no debe exceder 128 caracteres' })
  descripcion?: string | null;

  @ApiPropertyOptional({
    description: 'Nuevo ambiente del activo (opcional)',
    example: 5,
    minimum: 1,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt({ message: 'ambiente_id debe ser un entero positivo' })
  @Min(1, { message: 'ambiente_id debe ser un entero positivo' })
  @Max(1000000, { message: 'ambiente_id no debe ser tan grande' })
  ambiente_id?: number | null;
}

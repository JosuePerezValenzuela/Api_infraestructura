/* eslint-disable indent */

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  Validate,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  IsBoolean,
} from 'class-validator';

// Validador de clase que obliga a que el payload traiga al menos un campo permitido.
@ValidatorConstraint({ name: 'TipoBloqueAtLeastOneField', async: false })
class TipoBloqueAtLeastOneField implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    const dto = args.object as UpdateTipoBloqueDto;
    return (
      dto.nombre !== undefined ||
      dto.descripcion !== undefined ||
      dto.activo !== undefined
    );
  }
}

export class UpdateTipoBloqueDto {
  @Validate(TipoBloqueAtLeastOneField, {
    message: 'Debes enviar al menos un campo para actualizar el tipo de bloque',
  })
  private readonly __atLeastOneFieldGuard__?: never;

  @ApiPropertyOptional({
    example: 'Edifcio de aulas',
    description:
      'Nombre del tipo de bloque. Se valida solo si el usuario lo envia.',
    maxLength: 64,
  })
  @IsOptional({ message: 'El nombre es opcional' })
  @IsString({ message: 'El nombre debe ser una cadena cuando se envia' })
  @MinLength(1, {
    message: 'El nombre debe tener entre 1 y 64 caracteres cuando se envia',
  })
  @MaxLength(64, {
    message: 'El nombre debe tener entre 1 y 64 caracteres cuando se envia',
  })
  nombre?: string;

  @ApiPropertyOptional({
    example: 'Bloque destinado a aulas de clase',
    description:
      'Descripcion del tipo de bloque. Se valida solo si el usuario lo envia.',
    maxLength: 256,
  })
  @IsOptional({ message: 'La descipcion es opcional' })
  @IsString({ message: 'La descripcion debe ser una cadena cuando se envia' })
  @MinLength(1, {
    message:
      'La descripcion debe tener entre 1 y 256 caracteres cuando se envia',
  })
  @MaxLength(256, {
    message:
      'La descripcion debe tener entre 1 y 256 caracteres cuando se envia',
  })
  descripcion?: string;

  @ApiPropertyOptional({
    example: true,
    description:
      'Indica si el tipo de bloque sigue activo. Se valida solo si se envia.',
  })
  @IsOptional({ message: 'El estado activo es opcional' })
  @IsBoolean({ message: 'El estado activo debe ser verdadero o falso' })
  activo?: boolean;
}

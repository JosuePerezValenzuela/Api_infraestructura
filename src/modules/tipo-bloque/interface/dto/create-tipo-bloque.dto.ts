/* eslint-disable indent */
import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateTipoBloqueDto {
  @ApiProperty({ example: 'Edificio de aulas', maxLength: 64 })
  @IsDefined({ message: 'El nombre es obligatorio' })
  @IsString({ message: 'El nombre debe ser una cadena' })
  @IsNotEmpty({ message: 'El nombre no puede estar vacio' })
  @MaxLength(64, { message: 'El nombre no debe exceder los 64 caracteres' })
  nombre!: string;

  @ApiProperty({
    example: 'Edificio destinado al dictado de clases',
    maxLength: 256,
  })
  @IsDefined({ message: 'La descripcion es obligatoria' })
  @IsString({ message: 'La descripcon debe ser una cadena' })
  @IsNotEmpty({ message: 'La descripcion no puede estar vacia' })
  @MaxLength(256, {
    message: 'La descripcion no debe exceder los 256 caracteres',
  })
  descripcion!: string;
}

/* eslint-disable indent */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

// DTO para validar el query param de búsqueda por NIA.
export class GetActivoByNiaQueryDto {
  @ApiProperty({
    description: 'NIA del activo a consultar',
    maxLength: 32,
    example: 'NIA-0009',
  })
  @IsString({ message: 'nia debe ser texto' })
  @IsNotEmpty({ message: 'nia no puede estar vacio' })
  @MaxLength(32, { message: 'nia no debe exceder 32 caracteres' })
  nia!: string;
}

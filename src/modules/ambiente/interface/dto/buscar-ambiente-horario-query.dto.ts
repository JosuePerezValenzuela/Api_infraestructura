import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class BuscarAmbienteHorarioQueryDto {
  @ApiProperty({
    description: 'Código de la facultad',
    example: '20',
    maxLength: 16,
  })
  @IsString({ message: 'codigo_facultad debe ser string' })
  @MaxLength(16, { message: 'codigo_facultad debe tener máximo 16 caracteres' })
  codigo_facultad!: string;

  @ApiProperty({
    description:
      'Código del ambiente (comparado con el campo codigo de la tabla)',
    example: 'E505',
    maxLength: 16,
  })
  @IsString({ message: 'codigo_ambiente debe ser string' })
  @MaxLength(16, { message: 'codigo_ambiente debe tener máximo 16 caracteres' })
  codigo_ambiente!: string;

  @ApiProperty({
    description: 'Piso del ambiente',
    example: 1,
    minimum: 0,
  })
  @Type(() => Number)
  @IsInt({ message: 'piso debe ser un entero' })
  @Min(0, { message: 'piso debe ser mayor o igual a 0' })
  piso!: number;

  @ApiProperty({
    description: 'Día de la semana (0=Lunes, 6=Domingo)',
    example: 0,
    minimum: 0,
    maximum: 6,
  })
  @Type(() => Number)
  @IsInt({ message: 'dia debe ser un entero' })
  @Min(0, { message: 'dia debe ser mayor o igual a 0' })
  @Max(6, { message: 'dia debe ser menor o igual a 6' })
  dia!: number;

  @ApiProperty({
    description: 'Hora de inicio en formato HH:mm',
    example: '08:00',
  })
  @Matches(/^(?:[01]\d|2[0-3]):[0-5]\d$/, {
    message: 'hora_inicio debe tener formato HH:mm',
  })
  hora_inicio!: string;

  @ApiProperty({
    description: 'Hora de fin en formato HH:mm',
    example: '10:00',
  })
  @Matches(/^(?:[01]\d|2[0-3]):[0-5]\d$/, {
    message: 'hora_fin debe tener formato HH:mm',
  })
  hora_fin!: string;
}

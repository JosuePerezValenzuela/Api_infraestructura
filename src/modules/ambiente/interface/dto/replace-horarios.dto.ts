import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Matches, Min } from 'class-validator';

export class ReplaceHorariosDto {
  @ApiProperty({
    description: 'Hora de apertura del ambiente en formato HH:mm',
    example: '07:00',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'hora_apertura debe ser texto' })
  @Matches(/^(?:[01]\d|2[0-3]):[0-5]\d$/, {
    message: 'hora_apertura debe tener formato HH:mm',
  })
  hora_apertura?: string | null;

  @ApiProperty({
    description: 'Hora de cierre del ambiente en formato HH:mm',
    example: '21:00',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'hora_cierre debe ser texto' })
  @Matches(/^(?:[01]\d|2[0-3]):[0-5]\d$/, {
    message: 'hora_cierre debe tener formato HH:mm',
  })
  hora_cierre?: string | null;

  @ApiProperty({
    description: 'Duracion base en minutos para bloques de horario',
    example: 90,
    minimum: 1,
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt({ message: 'periodo debe ser un entero positivo' })
  @Min(1, { message: 'periodo debe ser un entero positivo' })
  periodo?: number | null;
}

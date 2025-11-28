/* eslint-disable indent */
import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class HorarioSlotDto {
  @ApiProperty({
    description: 'Dia de la semana (0=lunes, 6=domingo)',
    minimum: 0,
    maximum: 6,
    example: 0,
  })
  @IsInt({ message: 'dia debe ser un entero' })
  @Min(0, { message: 'dia debe ser entre 0 y 6' })
  @Max(6, { message: 'dia debe ser entre 0 y 6' })
  dia!: number;

  @ApiProperty({
    description: 'Hora de inicio en formato HH:mm',
    example: '08:00',
  })
  @IsString({ message: 'hora_inicio debe ser texto' })
  @IsNotEmpty({ message: 'hora_inicio es obligatorio' })
  @Matches(/^(?:[01]\d|2[0-3]):[0-5]\d$/, {
    message: 'hora_inicio debe tener formato HH:mm',
  })
  hora_inicio!: string;

  @ApiProperty({
    description: 'Hora de fin en formato HH:mm',
    example: '10:00',
  })
  @IsString({ message: 'hora_fin debe ser texto' })
  @IsNotEmpty({ message: 'hora_fin es obligatorio' })
  @Matches(/^(?:[01]\d|2[0-3]):[0-5]\d$/, {
    message: 'hora_fin debe tener formato HH:mm',
  })
  hora_fin!: string;
}

export class ReplaceHorariosDto {
  @ApiProperty({
    description:
      'Lista de franjas horarias a reemplazar completamente para el ambiente',
    type: [HorarioSlotDto],
    example: [
      { dia: 0, hora_inicio: '08:00', hora_fin: '10:00' },
      { dia: 1, hora_inicio: '11:00', hora_fin: '12:00' },
    ],
  })
  @IsArray({ message: 'franjas debe ser un arreglo' })
  @ArrayMinSize(0, { message: 'franjas no puede ser nulo' })
  @ValidateNested({ each: true })
  @Type(() => HorarioSlotDto)
  franjas!: HorarioSlotDto[];
}

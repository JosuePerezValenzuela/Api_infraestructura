import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class HorarioDiaDto {
  @ApiProperty({
    description: 'Dia de la semana (0=lunes, 6=domingo)',
    example: 0,
    minimum: 0,
    maximum: 6,
  })
  @IsInt({ message: 'dia debe ser un entero' })
  @Min(0, { message: 'dia debe estar entre 0 y 6' })
  @Max(6, { message: 'dia debe estar entre 0 y 6' })
  dia!: number;

  @ApiProperty({
    description: 'Hora de apertura en formato HH:mm',
    example: '06:45',
  })
  @IsString({ message: 'apertura debe ser texto' })
  @Min(0)
  apertura!: string;

  @ApiProperty({
    description: 'Hora de cierre en formato HH:mm',
    example: '21:45',
  })
  @IsString({ message: 'cierre debe ser texto' })
  @Min(0)
  cierre!: string;
}

export class ReplaceHorariosDto {
  @ApiProperty({
    description: 'Periodo en minutos (duracion de cada bloque)',
    example: 45,
    minimum: 1,
  })
  @IsInt({ message: 'periodo debe ser un entero' })
  @Min(1, { message: 'periodo debe ser positivo' })
  periodo!: number;

  @ApiProperty({
    description: 'Lista de horarios de operacion por dia',
    type: [HorarioDiaDto],
    example: [
      { dia: 0, apertura: '06:45', cierre: '21:45' },
      { dia: 5, apertura: '06:45', cierre: '14:15' },
    ],
  })
  @IsArray({ message: 'horarios debe ser un arreglo' })
  @ValidateNested({ each: true })
  @Type(() => HorarioDiaDto)
  horarios!: HorarioDiaDto[];
}

import { IsEnum, IsInt, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ReporteAmbienteFormato {
  PDF = 'pdf',
  EXCEL = 'excel',
}

export class GenerarReporteAmbienteDto {
  @ApiProperty({ description: 'ID del ambiente', example: 1 })
  @IsInt({ message: 'id debe ser un entero' })
  @IsPositive({ message: 'id debe ser positivo' })
  id: number;

  @ApiProperty({ enum: ReporteAmbienteFormato, example: 'pdf' })
  @IsEnum(ReporteAmbienteFormato)
  formato: ReporteAmbienteFormato;
}

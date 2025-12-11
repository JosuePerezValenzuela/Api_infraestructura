/* eslint-disable indent */
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

// Formatos soportados para descargar el reporte de un ambiente.
export enum ReporteAmbienteFormato {
  PDF = 'pdf',
  EXCEL = 'excel',
}

export class GenerarReporteAmbienteDto {
  // Codigo unico del ambiente que se desea reportar (por ejemplo FCyT-001).
  @IsString()
  @IsNotEmpty()
  codigo: string;

  // Formato de salida requerido: pdf o excel.
  @IsEnum(ReporteAmbienteFormato)
  formato: ReporteAmbienteFormato;
}

/* eslint-disable indent */
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum ReporteScope {
  CAMPUS = 'campus',
  FACULTAD = 'facultad',
  BLOQUE = 'bloque',
}

export enum ReporteFormato {
  XLSX = 'xlsx',
  PDF = 'pdf',
}

export class GenerarReporteInventarioDto {
  @IsEnum(ReporteScope)
  scope: ReporteScope;

  @IsString()
  @IsNotEmpty()
  scopeId: string;

  @IsEnum(ReporteFormato)
  formato: ReporteFormato;

  @IsOptional()
  @IsString()
  locale?: string;
}

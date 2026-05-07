import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

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

  // IDs en BD son integer → lo tratamos como number
  @Type(() => Number)
  @IsInt()
  @Min(1)
  scopeId: number;

  @IsEnum(ReporteFormato)
  formato: ReporteFormato;

  @IsOptional()
  @IsString()
  locale?: string;
}

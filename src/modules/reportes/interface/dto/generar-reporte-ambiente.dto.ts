import { IsEnum, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ReporteAmbienteFormato {
  PDF = 'pdf',
  EXCEL = 'excel',
}

export class GenerarReporteAmbienteDto {
  @ApiProperty({
    description: 'Código del ambiente',
    example: 'AULA-101',
    maxLength: 16,
  })
  @IsString({ message: 'codigo debe ser una cadena' })
  @MaxLength(16, { message: 'codigo no debe exceder 16 caracteres' })
  codigo!: string;

  @ApiProperty({ enum: ReporteAmbienteFormato, example: 'pdf' })
  @IsEnum(ReporteAmbienteFormato)
  formato!: ReporteAmbienteFormato;
}

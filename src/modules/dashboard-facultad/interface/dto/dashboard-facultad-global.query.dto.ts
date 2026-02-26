/* eslint-disable indent */
import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DashboardFacultadGlobalQueryDto {
  @ApiPropertyOptional({
    description: 'Identificadores de campus separados por coma (ej: 1,2,3)',
    example: '1,2,3',
  })
  @IsOptional()
  @IsString()
  campusIds?: string;

  @ApiPropertyOptional({
    description: 'Identificadores de facultad separados por coma (ej: 10,11)',
    example: '10,11',
  })
  @IsOptional()
  @IsString()
  facultadIds?: string;

  @ApiPropertyOptional({
    description: 'Indica si se incluyen registros inactivos; true por defecto',
    type: Boolean,
    enum: [true, false],
    example: true,
    default: true,
  })
  @IsOptional()
  @IsString()
  includeInactive?: string | boolean;

  @ApiPropertyOptional({
    description:
      'Tamano del slot en minutos para metricas de ocupacion (permitidos: 15,30,45,60)',
    example: '45',
    default: '45',
  })
  @IsOptional()
  @IsString()
  slotMinutes?: string;

  @ApiPropertyOptional({
    description:
      'Dias de semana separados por coma (0=domingo ... 6=sabado). Por defecto 0,1,2,3,4,5,6',
    example: '1,2,3,4,5',
    default: '0,1,2,3,4,5,6',
  })
  @IsOptional()
  @IsString()
  dias?: string;
}

/* eslint-disable indent */
import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DashboardCampusGlobalQueryDto {
  @ApiPropertyOptional({
    description: 'Identificadores de campus separados por coma (ej: 1,2,3)',
    example: '1,2,3',
  })
  @IsOptional()
  @IsString()
  campusIds?: string;

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
}

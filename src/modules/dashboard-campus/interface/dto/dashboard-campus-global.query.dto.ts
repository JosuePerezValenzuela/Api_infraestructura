/* eslint-disable indent */
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DashboardCampusGlobalQueryDto {
  @ApiPropertyOptional({
    description: 'Identificadores de campus separados por coma (ej: 1,2,3)',
    example: '1,2,3',
  })
  campusIds?: string;

  @ApiPropertyOptional({
    description: 'Indica si se incluyen registros inactivos; true por defecto',
    example: true,
    default: true,
  })
  includeInactive?: string | boolean;
}

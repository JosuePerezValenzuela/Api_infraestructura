/* eslint-disable indent */
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DashboardCampusDetailQueryDto {
  @ApiPropertyOptional({
    description: 'Indica si se incluyen registros inactivos; true por defecto',
    example: true,
    default: true,
  })
  includeInactive?: string | boolean;
}

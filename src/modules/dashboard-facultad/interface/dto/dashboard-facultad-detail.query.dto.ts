/* eslint-disable indent */
import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DashboardFacultadDetailQueryDto {
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

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class DashboardBloqueDetailQueryDto {
  @ApiPropertyOptional({
    description: 'Indica si se incluyen registros inactivos (true por defecto)',
    type: Boolean,
    enum: ['true', 'false'],
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  includeInactive?: boolean = true;
}
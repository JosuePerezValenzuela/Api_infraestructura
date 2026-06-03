import { Injectable } from '@nestjs/common';
import { DashboardBloqueRepositoryPort } from '../domain/dashboard-bloque.repository.port';
import {
  DashboardBloqueDetailFilters,
  DashboardBloqueDetailResult,
} from '../domain/dashboard-bloque.types';

@Injectable()
export class GetBloqueDashboardDetailUseCase {
  constructor(private readonly repository: DashboardBloqueRepositoryPort) {}

  async execute(
    filters: DashboardBloqueDetailFilters,
  ): Promise<DashboardBloqueDetailResult | null> {
    return this.repository.getDetailDashboard(filters);
  }
}

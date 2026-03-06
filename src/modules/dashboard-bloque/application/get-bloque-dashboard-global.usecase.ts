import { Injectable } from '@nestjs/common';
import {
  DashboardBloqueGlobalFilters,
  DashboardBloqueGlobalResult,
} from '../domain/dashboard-bloque.types';
import { DashboardBloqueRepositoryPort } from '../domain/dashboard-bloque.repository.port';

@Injectable()
export class GetBloqueDashboardGlobalUseCase {
  constructor(private readonly dashboardRepo: DashboardBloqueRepositoryPort) {}

  async execute(
    filters: DashboardBloqueGlobalFilters,
  ): Promise<DashboardBloqueGlobalResult> {
    return this.dashboardRepo.getGlobalDashboard(filters);
  }
}

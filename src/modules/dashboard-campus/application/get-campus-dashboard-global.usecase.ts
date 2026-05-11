import { Injectable } from '@nestjs/common';
import {
  DashboardGlobalFilters,
  DashboardGlobalResult,
} from '../domain/dashboard-campus.types';
import { DashboardCampusRepositoryPort } from '../domain/dashboard-campus.repository.port';
import { DashboardCacheService } from './dashboard-cache.service';

@Injectable()
export class GetCampusDashboardGlobalUseCase {
  constructor(
    private readonly dashboardRepo: DashboardCampusRepositoryPort,
    private readonly cacheService: DashboardCacheService,
  ) {}

  // Este metodo delega al repositorio para obtener el dashboard global con datos reales.
  async execute(
    filters: DashboardGlobalFilters,
  ): Promise<DashboardGlobalResult> {
    // Pasamos los filtros ya normalizados al repositorio y devolvemos la respuesta tal cual.
    return this.dashboardRepo.getGlobalDashboard(filters);
  }

  // Refresca manualmente las Materialized Views
  async refreshMaterializedViews(): Promise<void> {
    await this.cacheService.refreshMaterializedViews();
  }
}

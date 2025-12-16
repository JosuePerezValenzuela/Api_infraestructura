import { Injectable, NotFoundException } from '@nestjs/common';
import {
  DashboardDetailFilters,
  DashboardDetailResult,
} from '../domain/dashboard-campus.types';
import { DashboardCampusRepositoryPort } from '../domain/dashboard-campus.repository.port';

@Injectable()
export class GetCampusDashboardDetailUseCase {
  constructor(private readonly dashboardRepo: DashboardCampusRepositoryPort) {}

  // Este metodo obtiene el dashboard de detalle y valida existencia; si no existe, lanza 404.
  async execute(
    filters: DashboardDetailFilters,
  ): Promise<DashboardDetailResult> {
    // Consultamos al repositorio; si devuelve null significa que el campus no existe o fue filtrado.
    const detail = await this.dashboardRepo.getDetailDashboard(filters);
    if (!detail) {
      throw new NotFoundException({
        error: 'NOT_FOUND',
        message: 'Campus no encontrado',
      });
    }
    return detail;
  }
}

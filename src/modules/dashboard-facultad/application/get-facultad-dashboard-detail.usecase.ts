import { Injectable, NotFoundException } from '@nestjs/common';
import {
  DashboardFacultadDetailFilters,
  DashboardFacultadDetailResult,
} from '../domain/dashboard-facultad.types';
import { DashboardFacultadRepositoryPort } from '../domain/dashboard-facultad.repository.port';

@Injectable()
export class GetFacultadDashboardDetailUseCase {
  // Inyectamos el puerto de repositorio para consultar detalle sin acoplar el caso de uso a TypeORM.
  constructor(
    private readonly dashboardRepo: DashboardFacultadRepositoryPort,
  ) {}

  // Este metodo obtiene el dashboard detalle y valida existencia de la facultad solicitada.
  async execute(
    filters: DashboardFacultadDetailFilters,
  ): Promise<DashboardFacultadDetailResult> {
    // Consultamos el repositorio; null significa que la facultad no existe o fue filtrada.
    const detail = await this.dashboardRepo.getDetailDashboard(filters);
    if (!detail) {
      throw new NotFoundException({
        error: 'NOT_FOUND',
        message: 'Facultad no encontrada',
      });
    }
    return detail;
  }
}

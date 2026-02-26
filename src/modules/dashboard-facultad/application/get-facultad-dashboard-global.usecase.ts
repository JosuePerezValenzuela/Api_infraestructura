import { Injectable } from '@nestjs/common';
import {
  DashboardFacultadGlobalFilters,
  DashboardFacultadGlobalResult,
} from '../domain/dashboard-facultad.types';
import { DashboardFacultadRepositoryPort } from '../domain/dashboard-facultad.repository.port';

@Injectable()
export class GetFacultadDashboardGlobalUseCase {
  // Inyectamos el puerto de repositorio para obtener datos reales sin acoplar el caso de uso a infraestructura.
  constructor(
    private readonly dashboardRepo: DashboardFacultadRepositoryPort,
  ) {}

  // Este metodo delega al repositorio para obtener el dashboard global de facultades.
  async execute(
    filters: DashboardFacultadGlobalFilters,
  ): Promise<DashboardFacultadGlobalResult> {
    // Retornamos exactamente el resultado producido por el repositorio.
    return this.dashboardRepo.getGlobalDashboard(filters);
  }
}

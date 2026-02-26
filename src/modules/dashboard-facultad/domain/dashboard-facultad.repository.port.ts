import {
  DashboardFacultadDetailFilters,
  DashboardFacultadDetailResult,
  DashboardFacultadGlobalFilters,
  DashboardFacultadGlobalResult,
} from './dashboard-facultad.types';

// Puerto que define las operaciones de lectura del dashboard de facultades.
export abstract class DashboardFacultadRepositoryPort {
  abstract getGlobalDashboard(
    filters: DashboardFacultadGlobalFilters,
  ): Promise<DashboardFacultadGlobalResult>;

  abstract getDetailDashboard(
    filters: DashboardFacultadDetailFilters,
  ): Promise<DashboardFacultadDetailResult | null>;
}

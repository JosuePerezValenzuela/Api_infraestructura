import {
  DashboardFacultadDetailFilters,
  DashboardFacultadDetailResult,
} from './dashboard-facultad.types';

// Puerto que define las operaciones de lectura del dashboard de facultades.
export abstract class DashboardFacultadRepositoryPort {
  abstract getDetailDashboard(
    filters: DashboardFacultadDetailFilters,
  ): Promise<DashboardFacultadDetailResult | null>;
}
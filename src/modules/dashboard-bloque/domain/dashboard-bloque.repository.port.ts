import {
  DashboardBloqueDetailFilters,
  DashboardBloqueDetailResult,
} from './dashboard-bloque.types';

export abstract class DashboardBloqueRepositoryPort {
  abstract getDetailDashboard(
    filters: DashboardBloqueDetailFilters,
  ): Promise<DashboardBloqueDetailResult | null>;
}

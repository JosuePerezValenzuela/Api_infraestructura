import {
  DashboardBloqueGlobalFilters,
  DashboardBloqueGlobalResult,
} from './dashboard-bloque.types';

export abstract class DashboardBloqueRepositoryPort {
  abstract getGlobalDashboard(
    filters: DashboardBloqueGlobalFilters,
  ): Promise<DashboardBloqueGlobalResult>;
}

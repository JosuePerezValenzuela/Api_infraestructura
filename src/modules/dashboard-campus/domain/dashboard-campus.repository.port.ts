import {
  DashboardDetailFilters,
  DashboardDetailResult,
  DashboardGlobalFilters,
  DashboardGlobalResult,
} from './dashboard-campus.types';

// Puerto que define las operaciones de lectura del dashboard de campus.
export abstract class DashboardCampusRepositoryPort {
  abstract getGlobalDashboard(
    filters: DashboardGlobalFilters,
  ): Promise<DashboardGlobalResult>;

  abstract getDetailDashboard(
    filters: DashboardDetailFilters,
  ): Promise<DashboardDetailResult | null>;
}

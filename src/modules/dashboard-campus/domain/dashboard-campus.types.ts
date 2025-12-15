export type DashboardGlobalFilters = {
  campusIds?: number[];
  includeInactive: boolean;
};

export type DashboardDetailFilters = {
  campusId: number;
  includeInactive: boolean;
};

export type DashboardGlobalResult = {
  schemaVersion: 1;
  filtersApplied: DashboardGlobalFilters;
  layout: { mode: 'global' };
  data: {
    kpis: Record<string, never>;
    charts: Record<string, never>;
    table: { rows: any[] };
  };
};

export type DashboardDetailResult = {
  schemaVersion: 1;
  filtersApplied: DashboardDetailFilters;
  layout: { mode: 'detail' };
  data: {
    kpis: Record<string, never>;
    charts: Record<string, never>;
    tables: { facultades: { rows: any[] } };
  };
};

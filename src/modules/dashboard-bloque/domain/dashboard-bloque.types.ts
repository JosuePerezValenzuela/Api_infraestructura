export type DashboardBloqueGlobalFilters = {
  campusIds?: number[];
  facultadIds?: number[];
  bloqueIds?: number[];
  tipoBloqueIds?: number[];
  includeInactive: boolean;
};

export type DashboardBloqueKpis = {
  campus: { activos: number; inactivos: number };
  facultades: { activos: number; inactivos: number };
  bloques: { activos: number; inactivos: number };
  ambientes: { activos: number; inactivos: number };
  capacidad: { total: number; examen: number };
  activos: {
    asignados: number;
    noAsignadosGlobal: number;
  };
};

export type DashboardBloqueTiposBloqueChart = {
  tipoBloqueId: number;
  tipoBloqueNombre: string;
  cantidad: number;
};

export type DashboardBloqueAmbientesPorBloqueChart = {
  bloqueId: number;
  bloqueNombre: string;
  ambientes: number;
};

export type DashboardBloqueCapacidadPorBloqueChart = {
  bloqueId: number;
  bloqueNombre: string;
  capacidadTotal: number;
  capacidadExamen: number;
};

export type DashboardBloqueActivosPorBloqueChart = {
  bloqueId: number;
  bloqueNombre: string;
  activosAsignados: number;
};

export type DashboardBloqueCharts = {
  tiposBloque: DashboardBloqueTiposBloqueChart[];
  ambientesPorBloque: DashboardBloqueAmbientesPorBloqueChart[];
  capacidadPorBloque: DashboardBloqueCapacidadPorBloqueChart[];
  activosPorBloque: DashboardBloqueActivosPorBloqueChart[];
};

export type DashboardBloqueResumenBloquesRow = {
  bloqueId: number;
  bloqueNombre: string;
  campusNombre: string;
  facultadNombre: string;
  tipoBloqueNombre: string;
  pisos: number;
  activo: boolean;
  ambientes: number;
  capacidadTotal: number;
  capacidadExamen: number;
  activosAsignados: number;
};

export type DashboardBloqueTables = {
  resumenBloques: DashboardBloqueResumenBloquesRow[];
};

export type DashboardBloqueGlobalResult = {
  schemaVersion: 2;
  filtersApplied: DashboardBloqueGlobalFilters;
  layout: { mode: 'global' };
  data: {
    kpis: DashboardBloqueKpis;
    charts: DashboardBloqueCharts;
    tables: DashboardBloqueTables;
  };
};

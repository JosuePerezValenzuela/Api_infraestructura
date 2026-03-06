export type DashboardBloqueGlobalFilters = {
  campusIds?: number[];
  facultadIds?: number[];
  bloqueIds?: number[];
  tipoBloqueIds?: number[];
  includeInactive: boolean;
  slotMinutes: number;
  dias?: number[];
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
  ocupacion: { pctPromedioGlobal: number };
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

export type DashboardBloqueOcupacionHeatmapSemanalChart = {
  dia: number;
  franja: string;
  slotsOcupados: number;
  slotsTotales: number;
  pctOcupacion: number;
};

export type DashboardBloqueOcupacionPorBloqueChart = {
  bloqueId: number;
  bloqueNombre: string;
  slotsOcupados: number;
  slotsTotales: number;
  pctOcupacion: number;
};

export type DashboardBloqueTopBloqueUtilizacionItem = {
  bloqueId: number;
  bloqueNombre: string;
  pctOcupacion: number;
  slotsOcupados: number;
  slotsTotales: number;
};

export type DashboardBloqueTopPisoUtilizacionItem = {
  bloqueId: number;
  bloqueNombre: string;
  piso: number;
  pctOcupacion: number;
  slotsOcupados: number;
  slotsTotales: number;
};

export type DashboardBloqueCharts = {
  tiposBloque: DashboardBloqueTiposBloqueChart[];
  ambientesPorBloque: DashboardBloqueAmbientesPorBloqueChart[];
  capacidadPorBloque: DashboardBloqueCapacidadPorBloqueChart[];
  activosPorBloque: DashboardBloqueActivosPorBloqueChart[];
  ocupacionHeatmapSemanal: DashboardBloqueOcupacionHeatmapSemanalChart[];
  ocupacionPorBloque: DashboardBloqueOcupacionPorBloqueChart[];
  topBloquesUtilizacion: {
    sobrecargadosTop10: DashboardBloqueTopBloqueUtilizacionItem[];
    subutilizadosTop10: DashboardBloqueTopBloqueUtilizacionItem[];
  };
  topPisosUtilizacion: {
    sobrecargadosTop10: DashboardBloqueTopPisoUtilizacionItem[];
    subutilizadosTop10: DashboardBloqueTopPisoUtilizacionItem[];
  };
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
  slotsOcupados: number;
  slotsTotales: number;
  pctOcupacion: number;
};

export type DashboardBloquePisosUtilizacionRow = {
  bloqueId: number;
  bloqueNombre: string;
  piso: number;
  ambientes: number;
  capacidadTotal: number;
  capacidadExamen: number;
  activosAsignados: number;
  slotsOcupados: number;
  slotsTotales: number;
  pctOcupacion: number;
};

export type DashboardBloqueTables = {
  resumenBloques: DashboardBloqueResumenBloquesRow[];
  pisosUtilizacion: DashboardBloquePisosUtilizacionRow[];
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

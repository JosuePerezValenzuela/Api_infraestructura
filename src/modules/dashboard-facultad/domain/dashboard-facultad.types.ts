export type DashboardFacultadGlobalFilters = {
  campusIds?: number[];
  facultadIds?: number[];
  includeInactive: boolean;
  slotMinutes: number;
  dias?: number[];
};

export type DashboardFacultadDetailFilters = {
  facultadId: number;
  includeInactive: boolean;
  slotMinutes: number;
  dias?: number[];
};

export type DashboardFacultadKpis = {
  facultades: { activos: number; inactivos: number };
  bloques: { activos: number; inactivos: number };
  ambientes: { activos: number; inactivos: number };
  capacidad: { total: number; examen: number };
  activos: {
    asignados: number;
    noAsignadosGlobal: number;
  };
};

export type DashboardFacultadTiposBloqueChart = {
  tipoBloqueId: number;
  tipoBloqueNombre: string;
  cantidad: number;
};

export type DashboardFacultadTiposAmbienteChart = {
  tipoAmbienteId: number;
  tipoAmbienteNombre: string;
  cantidad: number;
};

export type DashboardFacultadCapacidadPorBloqueChart = {
  bloqueId: number;
  bloqueNombre: string;
  capacidadTotal: number;
  capacidadExamen: number;
};

export type DashboardFacultadActivosPorBloqueChart = {
  bloqueId: number;
  bloqueNombre: string;
  activosAsignados: number;
};

export type DashboardFacultadAmbientesActivosInactivosPorBloqueChart = {
  bloqueId: number;
  bloqueNombre: string;
  activos: number;
  inactivos: number;
};

export type DashboardFacultadOcupacionHeatmapSemanalChart = {
  dia: number;
  franja: string;
  slotsOcupados: number;
  slotsTotales: number;
  pctOcupacion: number;
};

export type DashboardFacultadOcupacionPorBloqueChart = {
  bloqueId: number;
  bloqueNombre: string;
  slotsOcupados: number;
  slotsTotales: number;
  pctOcupacion: number;
};

export type DashboardFacultadUtilizacionAmbienteItem = {
  ambienteId: number;
  ambienteNombre: string;
  pctOcupacion: number;
  slotsOcupados: number;
  slotsTotales: number;
};

export type DashboardFacultadTopAmbientesUtilizacionChart = {
  sobrecargados: DashboardFacultadUtilizacionAmbienteItem[];
  subutilizados: DashboardFacultadUtilizacionAmbienteItem[];
};

export type DashboardFacultadResumenBloquesRow = {
  bloqueId: number;
  bloqueNombre: string;
  tipoBloqueNombre: string;
  pisos: number;
  activo: boolean;
  ambientes: number;
  tiposAmbiente: number;
  capacidadTotal: number;
  capacidadExamen: number;
  activosAsignados: number;
};

export type DashboardFacultadAmbientesUtilizacionRow = {
  ambienteId: number;
  ambienteNombre: string;
  bloqueNombre: string;
  slotsOcupados: number;
  slotsTotales: number;
  pctOcupacion: number;
};

export type DashboardFacultadCharts = {
  tiposBloque: DashboardFacultadTiposBloqueChart[];
  tiposAmbiente: DashboardFacultadTiposAmbienteChart[];
  capacidadPorBloque: DashboardFacultadCapacidadPorBloqueChart[];
  activosPorBloque: DashboardFacultadActivosPorBloqueChart[];
  ambientesActivosInactivosPorBloque: DashboardFacultadAmbientesActivosInactivosPorBloqueChart[];
  ocupacionHeatmapSemanal: DashboardFacultadOcupacionHeatmapSemanalChart[];
  ocupacionPorBloque: DashboardFacultadOcupacionPorBloqueChart[];
  topAmbientesUtilizacion: DashboardFacultadTopAmbientesUtilizacionChart;
};

export type DashboardFacultadTables = {
  resumenBloques: DashboardFacultadResumenBloquesRow[];
  ambientesUtilizacion: DashboardFacultadAmbientesUtilizacionRow[];
};

export type DashboardFacultadGlobalResult = {
  schemaVersion: 2;
  filtersApplied: DashboardFacultadGlobalFilters;
  layout: { mode: 'global' };
  data: {
    kpis: DashboardFacultadKpis;
    charts: DashboardFacultadCharts;
    tables: DashboardFacultadTables;
  };
};

export type DashboardFacultadDetailResult = {
  schemaVersion: 2;
  filtersApplied: DashboardFacultadDetailFilters;
  layout: { mode: 'detail' };
  data: {
    facultad: {
      id: number;
      nombre: string;
      nombreCorto: string | null;
      activo: boolean;
      campusId: number;
      campusNombre: string;
    };
    kpis: DashboardFacultadKpis;
    charts: DashboardFacultadCharts;
    tables: DashboardFacultadTables;
  };
};

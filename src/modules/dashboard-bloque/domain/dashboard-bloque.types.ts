// ------------------------------------------------------------
// DASHBOARD DETALLE DE BLOQUE
// ------------------------------------------------------------

export type DashboardBloqueDetailFilters = {
  bloqueId: number;
  includeInactive: boolean;
};

export type DashboardBloqueDetailKpis = {
  ambientes: { total: number; activos: number; inactivos: number };
  capacidad: { total: number; examen: number };
  activos: {
    asignados: number;
    sinAsignarGlobal: number;
  };
};

export type DashboardBloqueDetailCharts = {
  tiposAmbiente: { tipo: string; cantidad: number }[];
};

export type DashboardBloquePorAmbiente = {
  id: number;
  nombre: string;
  piso: number;
  capacidad: { total: number; examen: number };
  tipoAmbiente: string;
  activos: { asignados: number };
};

export type DashboardBloqueDetailResult = {
  schemaVersion: 2;
  filtersApplied: DashboardBloqueDetailFilters;
  layout: { mode: 'detail' };
  data: {
    bloque: {
      id: number;
      nombre: string;
      nombreCorto: string | null;
      activo: boolean;
      pisos: number;
      tipoBloqueId: number;
      tipoBloqueNombre: string;
      facultadId: number;
      facultadNombre: string;
      campusId: number;
      campusNombre: string;
    };
    kpis: DashboardBloqueDetailKpis;
    charts: DashboardBloqueDetailCharts;
    porAmbiente: DashboardBloquePorAmbiente[];
  };
};

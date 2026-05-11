export type DashboardFacultadDetailFilters = {
  facultadId: number;
  includeInactive: boolean;
};

export type DashboardFacultadKpis = {
  bloques: { total: number; activos: number; inactivos: number };
  ambientes: { total: number; activos: number; inactivos: number };
  capacidad: { total: number; examen: number };
  activos: {
    asignados: number;
    sinAsignarGlobal: number;
  };
};

export type DashboardFacultadCharts = {
  tiposBloque: { tipo: string; cantidad: number }[];
  tiposAmbiente: { tipo: string; cantidad: number }[];
};

export type DashboardFacultadPorBloque = {
  id: number;
  nombre: string;
  ambientes: number;
  capacidad: { total: number; examen: number };
  activos: { asignados: number };
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
    porBloque: DashboardFacultadPorBloque[];
  };
};
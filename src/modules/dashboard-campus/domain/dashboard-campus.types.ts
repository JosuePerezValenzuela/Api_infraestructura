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
    kpis: {
      campus: { activos: number; inactivos: number };
      facultades: { activos: number; inactivos: number };
      bloques: { activos: number; inactivos: number };
      ambientes: { activos: number; inactivos: number };
      capacidad: { total: number; examen: number };
      activos: {
        total: number;
        asignados: number;
        noAsignadosGlobal: number;
      };
    };
    charts: {
      rankingAmbientesPorCampus: {
        campusId: number;
        campusNombre: string;
        ambientes: number;
        pctGlobal: number;
      }[];
      capacidadTotalPorCampus: {
        campusId: number;
        campusNombre: string;
        capacidadTotal: number;
        pctGlobal: number;
      }[];
      capacidadExamenPorCampus: {
        campusId: number;
        campusNombre: string;
        capacidadExamen: number;
        pctGlobal: number;
      }[];
      activosPorCampus: {
        campusId: number | null;
        campusNombre: string;
        asignados: number;
        noAsignados: number;
        pctGlobal: number;
      }[];
      ambientesActivosInactivosPorCampus: {
        campusId: number;
        campusNombre: string;
        activos: number;
        inactivos: number;
      }[];
    };
    table: {
      campusResumen: {
        campusId: number;
        campusNombre: string;
        facultades: number;
        bloques: number;
        tiposBloque: number;
        ambientes: number;
        tiposAmbiente: number;
        capacidadTotal: number;
        capacidadExamen: number;
        activosAsignados: number;
      }[];
    };
  };
};

export type DashboardDetailResult = {
  schemaVersion: 1;
  filtersApplied: DashboardDetailFilters;
  layout: { mode: 'detail' };
  data: {
    campus: { id: number; nombre: string; activo: boolean };
    kpis: {
      facultades: { activos: number; inactivos: number };
      bloques: { activos: number; inactivos: number };
      ambientes: { activos: number; inactivos: number };
      capacidad: { total: number; examen: number };
      activos: {
        asignados: number;
        noAsignadosGlobal: number;
      };
    };
    charts: {
      tiposBloque: {
        tipoBloqueId: number;
        tipoBloqueNombre: string;
        cantidad: number;
      }[];
      tiposAmbiente: {
        tipoAmbienteId: number;
        tipoAmbienteNombre: string;
        cantidad: number;
      }[];
    };
    tables: {
      facultadesResumen: {
        facultadId: number;
        facultadNombre: string;
        bloques: number;
        tiposBloque: number;
        ambientes: number;
        tiposAmbiente: number;
        capacidadTotal: number;
        capacidadExamen: number;
        activosAsignados: number;
      }[];
    };
  };
};

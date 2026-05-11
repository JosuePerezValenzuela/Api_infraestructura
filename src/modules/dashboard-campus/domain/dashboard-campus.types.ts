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
      campus: { total: number; activos: number; inactivos: number };
      facultades: { total: number; activos: number; inactivos: number };
      bloques: { total: number; activos: number; inactivos: number };
      ambientes: { total: number; activos: number; inactivos: number };
      capacidad: { total: number; examen: number };
      activos: { asignados: number; sinAsignar: number };
    };
    rankings: {
      porCantidadAmbientes: {
        campusId: number;
        nombre: string;
        cantidad: number;
      }[];
      porCapacidadTotal: {
        campusId: number;
        nombre: string;
        capacidad: number;
      }[];
    };
    distribuciones: {
      tiposBloquePorCampus: {
        nombre: string;
        cantidadTotal: number;
        tipos: { tipo: string; cantidad: number }[];
      }[];
      tiposAmbientePorCampus: {
        nombre: string;
        cantidadTotal: number;
        tipos: { tipo: string; cantidad: number }[];
      }[];
    };
    porCampus: {
      id: number;
      nombre: string;
      facultades: number;
      bloques: number;
      ambientes: number;
      capacidad: { total: number; examen: number };
      activos: { asignados: number; sinAsignar: number };
    }[];
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

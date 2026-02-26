// En este archivo definimos las pruebas unitarias del caso de uso global del dashboard-facultad.
// El objetivo es fijar primero el comportamiento esperado (TDD, fase RED).

// Importamos el caso de uso que vamos a probar.
import { GetFacultadDashboardGlobalUseCase } from './get-facultad-dashboard-global.usecase';
// Importamos tipos para construir filtros y respuesta de forma coherente con el contrato del dominio.
import type {
  DashboardFacultadDetailFilters,
  DashboardFacultadDetailResult,
  DashboardFacultadGlobalFilters,
  DashboardFacultadGlobalResult,
} from '../domain/dashboard-facultad.types';
import type { DashboardFacultadRepositoryPort } from '../domain/dashboard-facultad.repository.port';

// Definimos un mock completo del port para cumplir el contrato del constructor del caso de uso.
type FakeDashboardFacultadRepository = DashboardFacultadRepositoryPort & {
  getGlobalDashboard: jest.Mock<
    Promise<DashboardFacultadGlobalResult>,
    [DashboardFacultadGlobalFilters]
  >;
  getDetailDashboard: jest.Mock<
    Promise<DashboardFacultadDetailResult | null>,
    [DashboardFacultadDetailFilters]
  >;
};

describe('GetFacultadDashboardGlobalUseCase', () => {
  it('delega en el repositorio y retorna el dashboard global', async () => {
    // Construimos filtros de entrada tal como llegaran desde el controlador ya normalizados.
    const filters: DashboardFacultadGlobalFilters = {
      campusIds: [1, 2],
      facultadIds: [10, 11],
      includeInactive: true,
      slotMinutes: 45,
      dias: [0, 1, 2, 3, 4, 5, 6],
    };

    // Preparamos una respuesta simulada del repositorio con la forma del contrato esperado.
    const repoResult: DashboardFacultadGlobalResult = {
      schemaVersion: 2,
      filtersApplied: filters,
      layout: { mode: 'global' },
      data: {
        kpis: {
          facultades: { activos: 3, inactivos: 1 },
          bloques: { activos: 10, inactivos: 2 },
          ambientes: { activos: 30, inactivos: 4 },
          capacidad: { total: 1200, examen: 800 },
          activos: { asignados: 500, noAsignadosGlobal: 20 },
        },
        charts: {
          tiposBloque: [],
          tiposAmbiente: [],
          capacidadPorBloque: [],
          activosPorBloque: [],
          ambientesActivosInactivosPorBloque: [],
          ocupacionHeatmapSemanal: [],
          ocupacionPorBloque: [],
          topAmbientesUtilizacion: { sobrecargados: [], subutilizados: [] },
        },
        tables: { resumenBloques: [], ambientesUtilizacion: [] },
      },
    };

    // Creamos el repositorio falso con un mock que devuelve el resultado esperado.
    const repository: FakeDashboardFacultadRepository = {
      getGlobalDashboard: jest.fn().mockResolvedValue(repoResult),
      getDetailDashboard: jest.fn(),
    };

    // Instanciamos el caso de uso con el repositorio falso.
    const useCase = new GetFacultadDashboardGlobalUseCase(repository);

    // Ejecutamos el caso de uso para obtener la salida real.
    const result = await useCase.execute(filters);

    // Verificamos que el caso de uso delega la consulta exactamente con los filtros recibidos.
    expect(repository.getGlobalDashboard).toHaveBeenCalledWith(filters);
    // Verificamos que el caso de uso retorna exactamente lo que responde el repositorio.
    expect(result).toEqual(repoResult);
  });
});

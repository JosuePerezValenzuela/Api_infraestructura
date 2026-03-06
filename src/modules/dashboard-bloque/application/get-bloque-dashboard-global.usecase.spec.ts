import { GetBloqueDashboardGlobalUseCase } from './get-bloque-dashboard-global.usecase';
import type { DashboardBloqueRepositoryPort } from '../domain/dashboard-bloque.repository.port';
import {
  DashboardBloqueGlobalFilters,
  DashboardBloqueGlobalResult,
} from '../domain/dashboard-bloque.types';

describe('GetBloqueDashboardGlobalUseCase', () => {
  it('delega en el repositorio y retorna el dashboard global', async () => {
    const filters: DashboardBloqueGlobalFilters = {
      campusIds: [1],
      facultadIds: [10],
      bloqueIds: [100],
      tipoBloqueIds: [2],
      includeInactive: true,
      slotMinutes: 45,
      dias: [1, 2, 3, 4, 5],
    };

    const expected: DashboardBloqueGlobalResult = {
      schemaVersion: 2,
      filtersApplied: filters,
      layout: { mode: 'global' },
      data: {
        kpis: {
          campus: { activos: 1, inactivos: 0 },
          facultades: { activos: 1, inactivos: 0 },
          bloques: { activos: 3, inactivos: 1 },
          ambientes: { activos: 20, inactivos: 2 },
          capacidad: { total: 900, examen: 450 },
          activos: { asignados: 120, noAsignadosGlobal: 10 },
          ocupacion: { pctPromedioGlobal: 65.5 },
        },
        charts: {
          tiposBloque: [],
          ambientesPorBloque: [],
          capacidadPorBloque: [],
          activosPorBloque: [],
          ocupacionHeatmapSemanal: [],
          ocupacionPorBloque: [],
          topBloquesUtilizacion: {
            sobrecargadosTop10: [],
            subutilizadosTop10: [],
          },
          topPisosUtilizacion: {
            sobrecargadosTop10: [],
            subutilizadosTop10: [],
          },
        },
        tables: { resumenBloques: [], pisosUtilizacion: [] },
      },
    };

    const dashboardRepo: jest.Mocked<DashboardBloqueRepositoryPort> = {
      getGlobalDashboard: jest.fn().mockResolvedValue(expected),
    } as unknown as jest.Mocked<DashboardBloqueRepositoryPort>;

    const useCase = new GetBloqueDashboardGlobalUseCase(dashboardRepo);

    const result = await useCase.execute(filters);

    expect(dashboardRepo.getGlobalDashboard).toHaveBeenCalledWith(filters);
    expect(result).toEqual(expected);
  });
});

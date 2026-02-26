// En este archivo definimos las pruebas unitarias del caso de uso detalle del dashboard-facultad.
// Primero fijamos comportamiento esperado en RED: delegacion y manejo de facultad inexistente.

// Importamos el caso de uso a probar.
import { GetFacultadDashboardDetailUseCase } from './get-facultad-dashboard-detail.usecase';
// Importamos tipos del dominio para declarar filtros y respuestas compatibles con el contrato.
import type {
  DashboardFacultadDetailFilters,
  DashboardFacultadDetailResult,
  DashboardFacultadGlobalFilters,
  DashboardFacultadGlobalResult,
} from '../domain/dashboard-facultad.types';
import type { DashboardFacultadRepositoryPort } from '../domain/dashboard-facultad.repository.port';

// Definimos un mock completo del port para cumplir el contrato del constructor del caso de uso.
type FakeDashboardFacultadRepository = DashboardFacultadRepositoryPort & {
  getDetailDashboard: jest.Mock<
    Promise<DashboardFacultadDetailResult | null>,
    [DashboardFacultadDetailFilters]
  >;
  getGlobalDashboard: jest.Mock<
    Promise<DashboardFacultadGlobalResult>,
    [DashboardFacultadGlobalFilters]
  >;
};

describe('GetFacultadDashboardDetailUseCase', () => {
  it('retorna el dashboard detalle cuando la facultad existe', async () => {
    // Definimos filtros de detalle ya parseados por el controlador.
    const filters: DashboardFacultadDetailFilters = {
      facultadId: 22,
      includeInactive: true,
      slotMinutes: 45,
      dias: [0, 1, 2, 3, 4, 5, 6],
    };

    // Preparamos una respuesta valida simulando que la facultad existe en base de datos.
    const repoResult: DashboardFacultadDetailResult = {
      schemaVersion: 2,
      filtersApplied: filters,
      layout: { mode: 'detail' },
      data: {
        facultad: {
          id: 22,
          nombre: 'Facultad de Ingenieria',
          nombreCorto: 'FI',
          activo: true,
          campusId: 1,
          campusNombre: 'Campus Central',
        },
        kpis: {
          facultades: { activos: 1, inactivos: 0 },
          bloques: { activos: 4, inactivos: 1 },
          ambientes: { activos: 20, inactivos: 2 },
          capacidad: { total: 650, examen: 420 },
          activos: { asignados: 180, noAsignadosGlobal: 20 },
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

    // Creamos el repositorio falso retornando la respuesta simulada.
    const repository: FakeDashboardFacultadRepository = {
      getDetailDashboard: jest.fn().mockResolvedValue(repoResult),
      getGlobalDashboard: jest.fn(),
    };

    // Instanciamos el caso de uso detalle con el repositorio falso.
    const useCase = new GetFacultadDashboardDetailUseCase(repository);

    // Ejecutamos el caso de uso.
    const result = await useCase.execute(filters);

    // Verificamos delegacion correcta al repositorio con los filtros originales.
    expect(repository.getDetailDashboard).toHaveBeenCalledWith(filters);
    // Verificamos salida exacta.
    expect(result).toEqual(repoResult);
  });

  it('lanza NotFoundException con formato estandar cuando la facultad no existe', async () => {
    // Definimos filtros de entrada.
    const filters: DashboardFacultadDetailFilters = {
      facultadId: 999,
      includeInactive: true,
      slotMinutes: 45,
      dias: [0, 1, 2, 3, 4, 5, 6],
    };

    // Simulamos que el repositorio no encontro registros para la facultad solicitada.
    const repository: FakeDashboardFacultadRepository = {
      getDetailDashboard: jest.fn().mockResolvedValue(null),
      getGlobalDashboard: jest.fn(),
    };

    // Instanciamos el caso de uso con el doble de prueba.
    const useCase = new GetFacultadDashboardDetailUseCase(repository);

    // Ejecutamos y esperamos la excepcion 404 con body consistente.
    await expect(useCase.execute(filters)).rejects.toMatchObject({
      response: {
        error: 'NOT_FOUND',
        message: 'Facultad no encontrada',
      },
      status: 404,
    });
  });
});

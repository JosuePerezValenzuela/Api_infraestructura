// En este archivo probamos el repositorio TypeORM del dashboard de campus con mocks de DataSource
// y explicamos cada paso para que alguien sin experiencia entienda qu  estamos validando.

import type { DataSource } from 'typeorm';
import { DashboardCampusTypeormRepository } from './dashboard-campus.typeorm.repository';

// Creamos un helper que arma un DataSource falso con el m todo query espiado por Jest.
const makeMockDataSource = () => {
  return {
    query: jest.fn(),
  } as unknown as jest.Mocked<DataSource>;
};

describe('DashboardCampusTypeormRepository.getGlobalDashboard', () => {
  it('mapea las agregaciones por campus a la forma del contrato y calcula kpis/pcts', async () => {
    // Simulamos dos campus con datos agregados ya filtrados seg n includeInactive/campusIds.
    const aggregatedRows = [
      {
        campus_id: 1,
        campus_nombre: 'Campus A',
        campus_activo: true,
        facultades_total: 2,
        facultades_activos: 2,
        facultades_inactivos: 0,
        bloques_total: 3,
        bloques_activos: 3,
        bloques_inactivos: 0,
        ambientes_total: 5,
        ambientes_activos: 4,
        ambientes_inactivos: 1,
        capacidad_total: 100,
        capacidad_examen: 60,
        tipos_bloque: 2,
        tipos_ambiente: 3,
        activos_asignados: 10,
      },
      {
        campus_id: 2,
        campus_nombre: 'Campus B',
        campus_activo: false,
        facultades_total: 1,
        facultades_activos: 0,
        facultades_inactivos: 1,
        bloques_total: 2,
        bloques_activos: 1,
        bloques_inactivos: 1,
        ambientes_total: 3,
        ambientes_activos: 1,
        ambientes_inactivos: 2,
        capacidad_total: 50,
        capacidad_examen: 30,
        tipos_bloque: 1,
        tipos_ambiente: 2,
        activos_asignados: 5,
      },
    ];
    // Activos sin asignar globales que se deben incluir en KPIs y el chart de activos.
    const unassignedRows = [{ no_asignados: 4 }];

    const dataSource = makeMockDataSource();
    // El repositorio hace dos queries: agregaciones por campus y activos no asignados.
    (dataSource.query as jest.Mock).mockResolvedValueOnce(aggregatedRows);
    (dataSource.query as jest.Mock).mockResolvedValueOnce(unassignedRows);

    const repo = new DashboardCampusTypeormRepository(
      dataSource as unknown as DataSource,
    );

    const result = await repo.getGlobalDashboard({
      campusIds: [1, 2],
      includeInactive: true,
    });

    // Validamos filtros aplicados en la respuesta.
    expect(result.filtersApplied).toEqual({
      campusIds: [1, 2],
      includeInactive: true,
    });
    // Validamos KPIs derivados de los datos simulados.
    expect(result.data.kpis.campus).toEqual({ activos: 1, inactivos: 1 });
    expect(result.data.kpis.facultades).toEqual({ activos: 2, inactivos: 1 });
    expect(result.data.kpis.bloques).toEqual({ activos: 4, inactivos: 1 });
    expect(result.data.kpis.ambientes).toEqual({ activos: 5, inactivos: 3 });
    expect(result.data.kpis.capacidad).toEqual({ total: 150, examen: 90 });
    expect(result.data.kpis.activos).toEqual({
      total: 19, // asignados (15) + no asignados (4)
      asignados: 15,
      noAsignadosGlobal: 4,
    });
    // Ranking de ambientes debe venir ordenado desc y con pcts respecto al total de ambientes (8).
    expect(result.data.charts.rankingAmbientesPorCampus[0]).toEqual({
      campusId: 1,
      campusNombre: 'Campus A',
      ambientes: 5,
      pctGlobal: 62.5,
    });
    // El entry "Sin asignar" debe aparecer en activosPorCampus con noAsignados > 0.
    const unassignedEntry = result.data.charts.activosPorCampus.find(
      (row) => row.campusId === null,
    );
    expect(unassignedEntry).toMatchObject({
      campusNombre: 'Sin asignar',
      noAsignados: 4,
    });
    // La tabla resumen debe incluir ambos campus con capacidades y conteos calculados.
    expect(result.data.table.campusResumen).toHaveLength(2);
    expect(result.data.table.campusResumen[0]).toMatchObject({
      campusId: 1,
      campusNombre: 'Campus A',
      facultades: 2,
      bloques: 3,
      tiposBloque: 2,
      ambientes: 5,
      tiposAmbiente: 3,
      capacidadTotal: 100,
      capacidadExamen: 60,
      activosAsignados: 10,
    });
  });
});

describe('DashboardCampusTypeormRepository.getDetailDashboard', () => {
  it('devuelve null cuando el campus no existe seg n los filtros', async () => {
    const dataSource = makeMockDataSource();
    // Primera query busca el campus; simulamos que no hay resultados.
    (dataSource.query as jest.Mock).mockResolvedValueOnce([]);

    const repo = new DashboardCampusTypeormRepository(
      dataSource as unknown as DataSource,
    );

    const result = await repo.getDetailDashboard({
      campusId: 99,
      includeInactive: false,
    });

    expect(result).toBeNull();
  });

  it('mapea el detalle del campus con KPIs, charts y tabla de facultades', async () => {
    const dataSource = makeMockDataSource();
    // 1) Campus base
    (dataSource.query as jest.Mock).mockResolvedValueOnce([
      { id: 10, nombre: 'Campus X', activo: true },
    ]);
    // 2) Resumen/KPIs del campus
    (dataSource.query as jest.Mock).mockResolvedValueOnce([
      {
        facultades_total: 2,
        facultades_activos: 2,
        facultades_inactivos: 0,
        bloques_total: 3,
        bloques_activos: 3,
        bloques_inactivos: 0,
        ambientes_total: 6,
        ambientes_activos: 5,
        ambientes_inactivos: 1,
        capacidad_total: 300,
        capacidad_examen: 200,
        activos_asignados: 40,
      },
    ]);
    // 3) Chart tipos de bloque
    (dataSource.query as jest.Mock).mockResolvedValueOnce([
      { tipo_bloque_id: 1, tipo_bloque_nombre: 'Acad', cantidad: 2 },
    ]);
    // 4) Chart tipos de ambiente
    (dataSource.query as jest.Mock).mockResolvedValueOnce([
      { tipo_ambiente_id: 5, tipo_ambiente_nombre: 'Aula', cantidad: 4 },
    ]);
    // 5) Tabla de facultades
    (dataSource.query as jest.Mock).mockResolvedValueOnce([
      {
        facultad_id: 1,
        facultad_nombre: 'FCE',
        bloques: 2,
        tipos_bloque: 1,
        ambientes: 4,
        tipos_ambiente: 2,
        capacidad_total: 200,
        capacidad_examen: 120,
        activos_asignados: 10,
      },
    ]);
    // 6) Activos no asignados globales
    (dataSource.query as jest.Mock).mockResolvedValueOnce([
      { no_asignados: 3 },
    ]);

    const repo = new DashboardCampusTypeormRepository(
      dataSource as unknown as DataSource,
    );

    const result = await repo.getDetailDashboard({
      campusId: 10,
      includeInactive: true,
    });

    expect(result?.data.campus).toEqual({
      id: 10,
      nombre: 'Campus X',
      activo: true,
    });
    expect(result?.data.kpis.ambientes).toEqual({ activos: 5, inactivos: 1 });
    expect(result?.data.kpis.capacidad).toEqual({ total: 300, examen: 200 });
    expect(result?.data.kpis.activos).toEqual({
      asignados: 40,
      noAsignadosGlobal: 3,
    });
    expect(result?.data.charts.tiposBloque[0]).toEqual({
      tipoBloqueId: 1,
      tipoBloqueNombre: 'Acad',
      cantidad: 2,
    });
    expect(result?.data.charts.tiposAmbiente[0]).toEqual({
      tipoAmbienteId: 5,
      tipoAmbienteNombre: 'Aula',
      cantidad: 4,
    });
    expect(result?.data.tables.facultadesResumen).toHaveLength(1);
  });
});

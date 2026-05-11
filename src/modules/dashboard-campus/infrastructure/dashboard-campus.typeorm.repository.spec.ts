// Tests del repositorio TypeORM del dashboard de campus

import type { DataSource } from 'typeorm';
import { DashboardCampusTypeormRepository } from './dashboard-campus.typeorm.repository';

const makeMockDataSource = () => {
  return {
    query: jest.fn(),
  } as unknown as jest.Mocked<DataSource>;
};

describe('DashboardCampusTypeormRepository.getGlobalDashboard', () => {
  it('devuelve dashboard global con KPIs, rankings y distribuciones', async () => {
    // Mock 1: Resumen por campus
    const summaryRows = [
      {
        campus_id: 1,
        campus_nombre: 'Campus A',
        campus_activo: true,
        facultades_total: 2,
        facultades_activos: 2,
        facultades_inactivos: 0,
        bloques_total: 3,
        bloques_activos: 2,
        bloques_inactivos: 1,
        ambientes_total: 5,
        ambientes_activos: 4,
        ambientes_inactivos: 1,
        capacidad_total: 100,
        capacidad_examen: 60,
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
        activos_asignados: 5,
      },
    ];

    // Mock 2: Tipos de bloque por campus
    const tiposBloqueRows = [
      { campus_id: 1, campus_nombre: 'Campus A', tipo_bloque_nombre: 'A', cantidad: 2 },
      { campus_id: 1, campus_nombre: 'Campus A', tipo_bloque_nombre: 'B', cantidad: 1 },
      { campus_id: 2, campus_nombre: 'Campus B', tipo_bloque_nombre: 'A', cantidad: 2 },
    ];

    // Mock 3: Tipos de ambiente por campus
    const tiposAmbienteRows = [
      { campus_id: 1, campus_nombre: 'Campus A', tipo_ambiente_nombre: 'Aula', cantidad: 3 },
      { campus_id: 1, campus_nombre: 'Campus A', tipo_ambiente_nombre: 'Laboratorio', cantidad: 2 },
      { campus_id: 2, campus_nombre: 'Campus B', tipo_ambiente_nombre: 'Aula', cantidad: 3 },
    ];

    // Mock 4: Activos sin asignar (la MV tiene columna 'cantidad')
    const unassignedRows = [{ cantidad: 4 }];

    const dataSource = makeMockDataSource();
    (dataSource.query as jest.Mock).mockResolvedValueOnce(summaryRows);
    (dataSource.query as jest.Mock).mockResolvedValueOnce(tiposBloqueRows);
    (dataSource.query as jest.Mock).mockResolvedValueOnce(tiposAmbienteRows);
    (dataSource.query as jest.Mock).mockResolvedValueOnce(unassignedRows);

    const repo = new DashboardCampusTypeormRepository(dataSource as unknown as DataSource);

    const result = await repo.getGlobalDashboard({
      campusIds: [1, 2],
      includeInactive: true,
    });

    // Filtros aplicados
    expect(result.filtersApplied).toEqual({ campusIds: [1, 2], includeInactive: true });

    // KPIs con nueva estructura (total, activos, inactivos)
    expect(result.data.kpis.campus).toEqual({ total: 2, activos: 1, inactivos: 1 });
    expect(result.data.kpis.facultades).toEqual({ total: 3, activos: 2, inactivos: 1 });
    expect(result.data.kpis.bloques).toEqual({ total: 5, activos: 3, inactivos: 2 });
    expect(result.data.kpis.ambientes).toEqual({ total: 8, activos: 5, inactivos: 3 });
    expect(result.data.kpis.capacidad).toEqual({ total: 150, examen: 90 });
    expect(result.data.kpis.activos).toEqual({ asignados: 15, sinAsignar: 4 });

    // Rankings
    expect(result.data.rankings.porCantidadAmbientes[0]).toEqual({
      campusId: 1,
      nombre: 'Campus A',
      cantidad: 5,
    });
    expect(result.data.rankings.porCapacidadTotal[0]).toEqual({
      campusId: 1,
      nombre: 'Campus A',
      capacidad: 100,
    });

    // Distribuciones
    expect(result.data.distribuciones.tiposBloquePorCampus).toHaveLength(2);
    expect(result.data.distribuciones.tiposAmbientePorCampus).toHaveLength(2);

    // Por campus
    expect(result.data.porCampus).toHaveLength(2);
    expect(result.data.porCampus[0]).toMatchObject({
      id: 1,
      nombre: 'Campus A',
      facultades: 2,
      bloques: 3,
      ambientes: 5,
      capacidad: { total: 100, examen: 60 },
      activos: { asignados: 10, sinAsignar: 0 },
    });
  });
});

describe('DashboardCampusTypeormRepository.getDetailDashboard', () => {
  it('devuelve null cuando el campus no existe según los filtros', async () => {
    const dataSource = makeMockDataSource();
    (dataSource.query as jest.Mock).mockResolvedValueOnce([]);

    const repo = new DashboardCampusTypeormRepository(dataSource as unknown as DataSource);

    const result = await repo.getDetailDashboard({ campusId: 99, includeInactive: false });

    expect(result).toBeNull();
  });

  it('mapea el detalle del campus con KPIs, charts y porFacultad', async () => {
    const dataSource = makeMockDataSource();
    // 1) Campus base
    (dataSource.query as jest.Mock).mockResolvedValueOnce([{ id: 10, nombre: 'Campus X', activo: true }]);
    // 2) Resumen/KPIs desde MV
    (dataSource.query as jest.Mock).mockResolvedValueOnce([
      {
        campus_id: 10,
        campus_nombre: 'Campus X',
        campus_activo: true,
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
    // 3) Tipos de bloque desde MV
    (dataSource.query as jest.Mock).mockResolvedValueOnce([
      { campus_id: 10, campus_nombre: 'Campus X', tipo_bloque_id: 1, tipo_bloque_nombre: 'Acad', cantidad: 2 },
    ]);
    // 4) Tipos de ambiente desde MV
    (dataSource.query as jest.Mock).mockResolvedValueOnce([
      { campus_id: 10, campus_nombre: 'Campus X', tipo_ambiente_id: 5, tipo_ambiente_nombre: 'Aula', cantidad: 4 },
    ]);
    // 5) Por facultad (query directo)
    (dataSource.query as jest.Mock).mockResolvedValueOnce([
      {
        facultad_id: 1,
        facultad_nombre: 'FCE',
        bloques: 2,
        ambientes: 4,
        capacidad_total: 200,
        capacidad_examen: 120,
        activos_asignados: 10,
      },
    ]);
    // 6) Activos no asignados globales (desde MV)
    (dataSource.query as jest.Mock).mockResolvedValueOnce([{ cantidad: 3 }]);

    const repo = new DashboardCampusTypeormRepository(dataSource as unknown as DataSource);

    const result = await repo.getDetailDashboard({ campusId: 10, includeInactive: true });

    expect(result?.data.campus).toEqual({ id: 10, nombre: 'Campus X', activo: true });
    expect(result?.data.kpis.ambientes).toEqual({ activos: 5, inactivos: 1 });
    expect(result?.data.kpis.capacidad).toEqual({ total: 300, examen: 200 });
    expect(result?.data.kpis.activos).toEqual({ asignados: 40, noAsignadosGlobal: 3 });
    expect(result?.data.charts.tiposBloque[0]).toEqual({ tipoBloqueId: 1, tipoBloqueNombre: 'Acad', cantidad: 2 });
    expect(result?.data.charts.tiposAmbiente[0]).toEqual({ tipoAmbienteId: 5, tipoAmbienteNombre: 'Aula', cantidad: 4 });
    expect(result?.data.porFacultad).toHaveLength(1);
    expect(result?.data.porFacultad[0]).toMatchObject({
      id: 1,
      nombre: 'FCE',
      bloques: 2,
      ambientes: 4,
      capacidad: { total: 200, examen: 120 },
      activos: { asignados: 10 },
    });
  });
});
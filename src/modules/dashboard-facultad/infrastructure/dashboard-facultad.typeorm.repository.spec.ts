// En este archivo probamos el repositorio TypeORM del dashboard de facultad usando un DataSource simulado.

import type { DataSource } from 'typeorm';
import { DashboardFacultadTypeormRepository } from './dashboard-facultad.typeorm.repository';

const makeMockDataSource = () => {
  return {
    query: jest.fn(),
  } as unknown as jest.Mocked<DataSource>;
};

describe('DashboardFacultadTypeormRepository.getGlobalDashboard', () => {
  it('mapea agregaciones por facultad y construye respuesta V2 con KPIs/charts/tables', async () => {
    const aggregatedRows = [
      {
        facultad_id: 10,
        facultad_nombre: 'Facultad A',
        facultad_nombre_corto: 'FA',
        facultad_activo: true,
        campus_id: 1,
        campus_nombre: 'Campus Central',
        bloques_total: 3,
        bloques_activos: 2,
        bloques_inactivos: 1,
        ambientes_total: 8,
        ambientes_activos: 6,
        ambientes_inactivos: 2,
        capacidad_total: 300,
        capacidad_examen: 180,
        activos_asignados: 50,
      },
      {
        facultad_id: 11,
        facultad_nombre: 'Facultad B',
        facultad_nombre_corto: 'FB',
        facultad_activo: false,
        campus_id: 1,
        campus_nombre: 'Campus Central',
        bloques_total: 2,
        bloques_activos: 1,
        bloques_inactivos: 1,
        ambientes_total: 4,
        ambientes_activos: 1,
        ambientes_inactivos: 3,
        capacidad_total: 120,
        capacidad_examen: 80,
        activos_asignados: 20,
      },
    ];
    const unassignedRows = [{ no_asignados: 7 }];
    const tiposBloqueRows = [
      { tipo_bloque_id: 1, tipo_bloque_nombre: 'Academico', cantidad: 4 },
    ];
    const tiposAmbienteRows = [
      { tipo_ambiente_id: 5, tipo_ambiente_nombre: 'Aula', cantidad: 10 },
    ];
    const capacidadPorBloqueRows = [
      {
        bloque_id: 101,
        bloque_nombre: 'Bloque A',
        capacidad_total: 250,
        capacidad_examen: 150,
      },
    ];
    const activosPorBloqueRows = [
      { bloque_id: 101, bloque_nombre: 'Bloque A', activos_asignados: 60 },
    ];
    const ambientesEstadoRows = [
      { bloque_id: 101, bloque_nombre: 'Bloque A', activos: 7, inactivos: 1 },
    ];
    const resumenBloquesRows = [
      {
        bloque_id: 101,
        bloque_nombre: 'Bloque A',
        tipo_bloque_nombre: 'Academico',
        pisos: 4,
        activo: true,
        ambientes: 9,
        tipos_ambiente: 3,
        capacidad_total: 250,
        capacidad_examen: 150,
        activos_asignados: 60,
      },
    ];

    const dataSource = makeMockDataSource();
    (dataSource.query as jest.Mock).mockResolvedValueOnce(aggregatedRows);
    (dataSource.query as jest.Mock).mockResolvedValueOnce(unassignedRows);
    (dataSource.query as jest.Mock).mockResolvedValueOnce(tiposBloqueRows);
    (dataSource.query as jest.Mock).mockResolvedValueOnce(tiposAmbienteRows);
    (dataSource.query as jest.Mock).mockResolvedValueOnce(
      capacidadPorBloqueRows,
    );
    (dataSource.query as jest.Mock).mockResolvedValueOnce(activosPorBloqueRows);
    (dataSource.query as jest.Mock).mockResolvedValueOnce(ambientesEstadoRows);
    (dataSource.query as jest.Mock).mockResolvedValueOnce(resumenBloquesRows);

    const repo = new DashboardFacultadTypeormRepository(
      dataSource as unknown as DataSource,
    );

    const filters = {
      campusIds: [1],
      facultadIds: [10, 11],
      includeInactive: true,
    };

    const result = await repo.getGlobalDashboard(filters);

    expect(result.schemaVersion).toBe(2);
    expect(result.layout).toEqual({ mode: 'global' });
    expect(result.filtersApplied).toEqual(filters);
    expect(result.data.kpis.facultades).toEqual({ activos: 1, inactivos: 1 });
    expect(result.data.kpis.bloques).toEqual({ activos: 3, inactivos: 2 });
    expect(result.data.kpis.ambientes).toEqual({ activos: 7, inactivos: 5 });
    expect(result.data.kpis.capacidad).toEqual({ total: 420, examen: 260 });
    expect(result.data.kpis.activos).toEqual({
      asignados: 70,
      noAsignadosGlobal: 7,
    });
    expect(result.data.charts.tiposBloque[0]).toEqual({
      tipoBloqueId: 1,
      tipoBloqueNombre: 'Academico',
      cantidad: 4,
    });
    expect(result.data.tables.resumenBloques[0]).toMatchObject({
      bloqueId: 101,
      bloqueNombre: 'Bloque A',
    });
  });
});

describe('DashboardFacultadTypeormRepository.getDetailDashboard', () => {
  it('retorna null cuando la facultad no existe segun filtros', async () => {
    const dataSource = makeMockDataSource();
    (dataSource.query as jest.Mock).mockResolvedValueOnce([]);

    const repo = new DashboardFacultadTypeormRepository(
      dataSource as unknown as DataSource,
    );

    const result = await repo.getDetailDashboard({
      facultadId: 999,
      includeInactive: false,
    });

    expect(result).toBeNull();
  });

  it('mapea el detalle de facultad a la estructura V2 con contexto/kpis/charts/tables', async () => {
    const dataSource = makeMockDataSource();
    (dataSource.query as jest.Mock).mockResolvedValueOnce([
      {
        id: 22,
        nombre: 'Facultad de Ingenieria',
        nombre_corto: 'FI',
        activo: true,
        campus_id: 1,
        campus_nombre: 'Campus Central',
      },
    ]);
    (dataSource.query as jest.Mock).mockResolvedValueOnce([
      {
        bloques_total: 4,
        bloques_activos: 3,
        bloques_inactivos: 1,
        ambientes_total: 20,
        ambientes_activos: 16,
        ambientes_inactivos: 4,
        capacidad_total: 800,
        capacidad_examen: 520,
        activos_asignados: 120,
      },
    ]);
    (dataSource.query as jest.Mock).mockResolvedValueOnce([
      { tipo_bloque_id: 1, tipo_bloque_nombre: 'Academico', cantidad: 3 },
    ]);
    (dataSource.query as jest.Mock).mockResolvedValueOnce([
      { tipo_ambiente_id: 5, tipo_ambiente_nombre: 'Aula', cantidad: 14 },
    ]);
    (dataSource.query as jest.Mock).mockResolvedValueOnce([
      {
        bloque_id: 101,
        bloque_nombre: 'Bloque A',
        capacidad_total: 300,
        capacidad_examen: 180,
      },
    ]);
    (dataSource.query as jest.Mock).mockResolvedValueOnce([
      { bloque_id: 101, bloque_nombre: 'Bloque A', activos_asignados: 60 },
    ]);
    (dataSource.query as jest.Mock).mockResolvedValueOnce([
      { bloque_id: 101, bloque_nombre: 'Bloque A', activos: 8, inactivos: 1 },
    ]);
    (dataSource.query as jest.Mock).mockResolvedValueOnce([
      {
        bloque_id: 101,
        bloque_nombre: 'Bloque A',
        tipo_bloque_nombre: 'Academico',
        pisos: 4,
        activo: true,
        ambientes: 9,
        tipos_ambiente: 3,
        capacidad_total: 300,
        capacidad_examen: 180,
        activos_asignados: 60,
      },
    ]);
    (dataSource.query as jest.Mock).mockResolvedValueOnce([
      { no_asignados: 11 },
    ]);

    const repo = new DashboardFacultadTypeormRepository(
      dataSource as unknown as DataSource,
    );

    const filters = {
      facultadId: 22,
      includeInactive: true,
    };
    const result = await repo.getDetailDashboard(filters);

    expect(result?.schemaVersion).toBe(2);
    expect(result?.layout).toEqual({ mode: 'detail' });
    expect(result?.filtersApplied).toEqual(filters);
    expect(result?.data.facultad).toEqual({
      id: 22,
      nombre: 'Facultad de Ingenieria',
      nombreCorto: 'FI',
      activo: true,
      campusId: 1,
      campusNombre: 'Campus Central',
    });
    expect(result?.data.kpis).toMatchObject({
      facultades: { activos: 1, inactivos: 0 },
      bloques: { activos: 3, inactivos: 1 },
      ambientes: { activos: 16, inactivos: 4 },
      capacidad: { total: 800, examen: 520 },
      activos: { asignados: 120, noAsignadosGlobal: 11 },
    });
    expect(result?.data.charts.tiposBloque[0]).toEqual({
      tipoBloqueId: 1,
      tipoBloqueNombre: 'Academico',
      cantidad: 3,
    });
    expect(result?.data.tables.resumenBloques[0]).toMatchObject({
      bloqueId: 101,
      bloqueNombre: 'Bloque A',
    });
  });
});

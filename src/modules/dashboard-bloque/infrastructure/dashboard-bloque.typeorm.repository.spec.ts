import type { DataSource } from 'typeorm';
import { DashboardBloqueTypeormRepository } from './dashboard-bloque.typeorm.repository';

const makeMockDataSource = () => {
  return {
    query: jest.fn(),
  } as unknown as jest.Mocked<DataSource>;
};

describe('DashboardBloqueTypeormRepository.getGlobalDashboard', () => {
  it('mapea agregaciones por bloque y construye respuesta V2 con KPIs/charts/tables', async () => {
    const aggregatedRows = [
      {
        campus_id: 1,
        campus_nombre: 'Central',
        campus_activo: true,
        facultad_id: 10,
        facultad_nombre: 'Ingenieria',
        facultad_activo: true,
        bloque_id: 100,
        bloque_nombre: 'Bloque A',
        bloque_activo: true,
        ambientes_activos: 5,
        ambientes_inactivos: 1,
        capacidad_total: 200,
        capacidad_examen: 120,
        activos_asignados: 40,
      },
      {
        campus_id: 2,
        campus_nombre: 'Sur',
        campus_activo: false,
        facultad_id: 20,
        facultad_nombre: 'Arquitectura',
        facultad_activo: false,
        bloque_id: 101,
        bloque_nombre: 'Bloque B',
        bloque_activo: false,
        ambientes_activos: 2,
        ambientes_inactivos: 3,
        capacidad_total: 150,
        capacidad_examen: 80,
        activos_asignados: 10,
      },
    ];

    const unassignedRows = [{ no_asignados: 7 }];
    const tiposBloqueRows = [
      { tipo_bloque_id: 1, tipo_bloque_nombre: 'Academico', cantidad: 2 },
    ];
    const ambientesPorBloqueRows = [
      { bloque_id: 100, bloque_nombre: 'Bloque A', ambientes: 6 },
    ];
    const capacidadPorBloqueRows = [
      {
        bloque_id: 100,
        bloque_nombre: 'Bloque A',
        capacidad_total: 200,
        capacidad_examen: 120,
      },
    ];
    const activosPorBloqueRows = [
      { bloque_id: 100, bloque_nombre: 'Bloque A', activos_asignados: 40 },
    ];
    const resumenBloquesRows = [
      {
        bloque_id: 100,
        bloque_nombre: 'Bloque A',
        campus_nombre: 'Central',
        facultad_nombre: 'Ingenieria',
        tipo_bloque_nombre: 'Academico',
        pisos: 4,
        activo: true,
        ambientes: 6,
        capacidad_total: 200,
        capacidad_examen: 120,
        activos_asignados: 40,
      },
    ];

    const dataSource = makeMockDataSource();
    (dataSource.query as jest.Mock).mockResolvedValueOnce(aggregatedRows);
    (dataSource.query as jest.Mock).mockResolvedValueOnce(unassignedRows);
    (dataSource.query as jest.Mock).mockResolvedValueOnce(tiposBloqueRows);
    (dataSource.query as jest.Mock).mockResolvedValueOnce(
      ambientesPorBloqueRows,
    );
    (dataSource.query as jest.Mock).mockResolvedValueOnce(
      capacidadPorBloqueRows,
    );
    (dataSource.query as jest.Mock).mockResolvedValueOnce(activosPorBloqueRows);
    (dataSource.query as jest.Mock).mockResolvedValueOnce(resumenBloquesRows);

    const repo = new DashboardBloqueTypeormRepository(
      dataSource as unknown as DataSource,
    );

    const filters = {
      campusIds: [1, 2],
      facultadIds: [10, 20],
      bloqueIds: [100, 101],
      tipoBloqueIds: [1],
      includeInactive: true,
    };

    const result = await repo.getGlobalDashboard(filters);

    expect(result.schemaVersion).toBe(2);
    expect(result.layout).toEqual({ mode: 'global' });
    expect(result.filtersApplied).toEqual(filters);

    expect(result.data.kpis.campus).toEqual({ activos: 1, inactivos: 1 });
    expect(result.data.kpis.facultades).toEqual({ activos: 1, inactivos: 1 });
    expect(result.data.kpis.bloques).toEqual({ activos: 1, inactivos: 1 });
    expect(result.data.kpis.ambientes).toEqual({ activos: 7, inactivos: 4 });
    expect(result.data.kpis.capacidad).toEqual({ total: 350, examen: 200 });
    expect(result.data.kpis.activos).toEqual({
      asignados: 50,
      noAsignadosGlobal: 7,
    });

    expect(result.data.charts.tiposBloque[0]).toEqual({
      tipoBloqueId: 1,
      tipoBloqueNombre: 'Academico',
      cantidad: 2,
    });
    expect(result.data.charts.ambientesPorBloque[0]).toEqual({
      bloqueId: 100,
      bloqueNombre: 'Bloque A',
      ambientes: 6,
    });
    expect(result.data.charts.capacidadPorBloque[0]).toEqual({
      bloqueId: 100,
      bloqueNombre: 'Bloque A',
      capacidadTotal: 200,
      capacidadExamen: 120,
    });
    expect(result.data.charts.activosPorBloque[0]).toEqual({
      bloqueId: 100,
      bloqueNombre: 'Bloque A',
      activosAsignados: 40,
    });
    expect(result.data.tables.resumenBloques[0]).toMatchObject({
      bloqueId: 100,
      bloqueNombre: 'Bloque A',
      campusNombre: 'Central',
      facultadNombre: 'Ingenieria',
      tipoBloqueNombre: 'Academico',
      pisos: 4,
      activo: true,
      ambientes: 6,
      capacidadTotal: 200,
      capacidadExamen: 120,
      activosAsignados: 40,
    });
  });
});

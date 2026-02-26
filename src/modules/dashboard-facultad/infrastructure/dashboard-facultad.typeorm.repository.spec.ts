// En este archivo probamos el repositorio TypeORM del dashboard de facultad usando un DataSource simulado.
// Primero fijamos comportamiento esperado (RED) para estructura V2 y reglas base de detalle/global.

import type { DataSource } from 'typeorm';
import { DashboardFacultadTypeormRepository } from './dashboard-facultad.typeorm.repository';

// Creamos un helper que devuelve un DataSource falso con query espiado por Jest.
const makeMockDataSource = () => {
  return {
    query: jest.fn(),
  } as unknown as jest.Mocked<DataSource>;
};

describe('DashboardFacultadTypeormRepository.getGlobalDashboard', () => {
  it('mapea agregaciones por facultad y construye respuesta V2 con KPIs/charts/tables', async () => {
    // Simulamos filas agregadas por facultad devueltas por SQL.
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
    // Simulamos activos no asignados globales.
    const unassignedRows = [{ no_asignados: 7 }];

    const dataSource = makeMockDataSource();
    // Query 1: agregados globales por facultad.
    (dataSource.query as jest.Mock).mockResolvedValueOnce(aggregatedRows);
    // Query 2: activos no asignados.
    (dataSource.query as jest.Mock).mockResolvedValueOnce(unassignedRows);

    const repo = new DashboardFacultadTypeormRepository(
      dataSource as unknown as DataSource,
    );

    const filters = {
      campusIds: [1],
      facultadIds: [10, 11],
      includeInactive: true,
      slotMinutes: 45,
      dias: [1, 2, 3, 4, 5],
    };

    const result = await repo.getGlobalDashboard(filters);

    // Validamos shape base del contrato V2.
    expect(result.schemaVersion).toBe(2);
    expect(result.layout).toEqual({ mode: 'global' });
    expect(result.filtersApplied).toEqual(filters);
    // Validamos KPI agregados principales.
    expect(result.data.kpis.facultades).toEqual({ activos: 1, inactivos: 1 });
    expect(result.data.kpis.bloques).toEqual({ activos: 3, inactivos: 2 });
    expect(result.data.kpis.ambientes).toEqual({ activos: 7, inactivos: 5 });
    expect(result.data.kpis.capacidad).toEqual({ total: 420, examen: 260 });
    expect(result.data.kpis.activos).toEqual({
      asignados: 70,
      noAsignadosGlobal: 7,
    });
    // Validamos que exista la estructura de charts y tables V2.
    expect(result.data.charts).toMatchObject({
      tiposBloque: expect.any(Array),
      tiposAmbiente: expect.any(Array),
      capacidadPorBloque: expect.any(Array),
      activosPorBloque: expect.any(Array),
      ambientesActivosInactivosPorBloque: expect.any(Array),
      ocupacionHeatmapSemanal: expect.any(Array),
      ocupacionPorBloque: expect.any(Array),
      topAmbientesUtilizacion: {
        sobrecargados: expect.any(Array),
        subutilizados: expect.any(Array),
      },
    });
    expect(result.data.tables).toMatchObject({
      resumenBloques: expect.any(Array),
      ambientesUtilizacion: expect.any(Array),
    });
  });
});

describe('DashboardFacultadTypeormRepository.getDetailDashboard', () => {
  it('retorna null cuando la facultad no existe segun filtros', async () => {
    const dataSource = makeMockDataSource();
    // Primera query busca facultad base; devolvemos vacio.
    (dataSource.query as jest.Mock).mockResolvedValueOnce([]);

    const repo = new DashboardFacultadTypeormRepository(
      dataSource as unknown as DataSource,
    );

    const result = await repo.getDetailDashboard({
      facultadId: 999,
      includeInactive: false,
      slotMinutes: 45,
      dias: [1, 2, 3, 4, 5],
    });

    expect(result).toBeNull();
  });

  it('mapea el detalle de facultad a la estructura V2 con contexto/kpis/charts/tables', async () => {
    const dataSource = makeMockDataSource();
    // 1) Facultad base
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
    // 2) Resumen KPI
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
    // 3) tiposBloque
    (dataSource.query as jest.Mock).mockResolvedValueOnce([
      { tipo_bloque_id: 1, tipo_bloque_nombre: 'Academico', cantidad: 3 },
    ]);
    // 4) tiposAmbiente
    (dataSource.query as jest.Mock).mockResolvedValueOnce([
      { tipo_ambiente_id: 5, tipo_ambiente_nombre: 'Aula', cantidad: 14 },
    ]);
    // 5) capacidadPorBloque
    (dataSource.query as jest.Mock).mockResolvedValueOnce([
      {
        bloque_id: 101,
        bloque_nombre: 'Bloque A',
        capacidad_total: 300,
        capacidad_examen: 180,
      },
    ]);
    // 6) activosPorBloque
    (dataSource.query as jest.Mock).mockResolvedValueOnce([
      { bloque_id: 101, bloque_nombre: 'Bloque A', activos_asignados: 60 },
    ]);
    // 7) ambientesActivosInactivosPorBloque
    (dataSource.query as jest.Mock).mockResolvedValueOnce([
      { bloque_id: 101, bloque_nombre: 'Bloque A', activos: 8, inactivos: 1 },
    ]);
    // 8) ocupacionHeatmapSemanal
    (dataSource.query as jest.Mock).mockResolvedValueOnce([
      {
        dia: 1,
        franja: '08:00-08:45',
        slots_ocupados: 10,
        slots_totales: 16,
        pct_ocupacion: 62.5,
      },
    ]);
    // 9) ocupacionPorBloque
    (dataSource.query as jest.Mock).mockResolvedValueOnce([
      {
        bloque_id: 101,
        bloque_nombre: 'Bloque A',
        slots_ocupados: 40,
        slots_totales: 64,
        pct_ocupacion: 62.5,
      },
    ]);
    // 10) top sobrecargados
    (dataSource.query as jest.Mock).mockResolvedValueOnce([
      {
        ambiente_id: 500,
        ambiente_nombre: 'Lab Redes',
        pct_ocupacion: 95,
        slots_ocupados: 19,
        slots_totales: 20,
      },
    ]);
    // 11) top subutilizados
    (dataSource.query as jest.Mock).mockResolvedValueOnce([
      {
        ambiente_id: 501,
        ambiente_nombre: 'Aula 3',
        pct_ocupacion: 8,
        slots_ocupados: 2,
        slots_totales: 25,
      },
    ]);
    // 12) resumenBloques
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
    // 13) ambientesUtilizacion
    (dataSource.query as jest.Mock).mockResolvedValueOnce([
      {
        ambiente_id: 500,
        ambiente_nombre: 'Lab Redes',
        bloque_nombre: 'Bloque A',
        slots_ocupados: 19,
        slots_totales: 20,
        pct_ocupacion: 95,
      },
    ]);
    // 14) no asignados global
    (dataSource.query as jest.Mock).mockResolvedValueOnce([
      { no_asignados: 11 },
    ]);

    const repo = new DashboardFacultadTypeormRepository(
      dataSource as unknown as DataSource,
    );

    const filters = {
      facultadId: 22,
      includeInactive: true,
      slotMinutes: 45,
      dias: [1, 2, 3, 4, 5],
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
    expect(result?.data.charts.ocupacionHeatmapSemanal[0]).toEqual({
      dia: 1,
      franja: '08:00-08:45',
      slotsOcupados: 10,
      slotsTotales: 16,
      pctOcupacion: 62.5,
    });
    expect(result?.data.tables.resumenBloques[0]).toMatchObject({
      bloqueId: 101,
      bloqueNombre: 'Bloque A',
    });
    expect(result?.data.tables.ambientesUtilizacion[0]).toMatchObject({
      ambienteId: 500,
      ambienteNombre: 'Lab Redes',
      pctOcupacion: 95,
    });
  });
});

import type { DataSource } from 'typeorm';
import { DashboardBloqueTypeormRepository } from './dashboard-bloque.typeorm.repository';

const makeMockDataSource = () => {
  return {
    query: jest.fn(),
  } as unknown as jest.Mocked<DataSource>;
};

describe('DashboardBloqueTypeormRepository.getDetailDashboard', () => {
  it('retorna null cuando el bloque no existe según filtros', async () => {
    const dataSource = makeMockDataSource();
    (dataSource.query as jest.Mock).mockResolvedValueOnce([]);

    const repo = new DashboardBloqueTypeormRepository(
      dataSource as unknown as DataSource,
    );

    const result = await repo.getDetailDashboard({
      bloqueId: 999,
      includeInactive: false,
    });

    expect(result).toBeNull();
  });

  it('mapea el detalle del bloque con estructura V2 (kpis/charts/porAmbiente)', async () => {
    const dataSource = makeMockDataSource();
    // 1) Bloque base
    (dataSource.query as jest.Mock).mockResolvedValueOnce([
      {
        id: '101',
        nombre: 'Bloque A',
        nombre_corto: 'Bloque A',
        activo: true,
        pisos: '4',
        tipo_bloque_id: '1',
        tipo_bloque_nombre: 'Académico',
        facultad_id: '22',
        facultad_nombre: 'Facultad de Ingeniería',
        campus_id: '1',
        campus_nombre: 'Campus Central',
      },
    ]);
    // 2) KPIs y summary
    (dataSource.query as jest.Mock).mockResolvedValueOnce([
      {
        ambientes_total: 12,
        ambientes_activos: 10,
        ambientes_inactivos: 2,
        capacidad_total: 540,
        capacidad_examen: 300,
        activos_asignados: 68,
      },
    ]);
    // 3) Chart - tipos de ambiente
    (dataSource.query as jest.Mock).mockResolvedValueOnce([
      { tipo_ambiente_nombre: 'Aula', cantidad: '8' },
      { tipo_ambiente_nombre: 'Laboratorio', cantidad: '3' },
      { tipo_ambiente_nombre: 'Auditorio', cantidad: '1' },
    ]);
    // 4) Por ambiente
    (dataSource.query as jest.Mock).mockResolvedValueOnce([
      {
        ambiente_id: '1001',
        ambiente_nombre: 'Aula 101',
        piso: '1',
        capacidad_total: '40',
        capacidad_examen: '30',
        tipo_ambiente_nombre: 'Aula',
        activos_asignados: '5',
      },
      {
        ambiente_id: '1002',
        ambiente_nombre: 'Laboratorio 1',
        piso: '2',
        capacidad_total: '30',
        capacidad_examen: '0',
        tipo_ambiente_nombre: 'Laboratorio',
        activos_asignados: '8',
      },
    ]);
    // 5) Activos no asignados globales
    (dataSource.query as jest.Mock).mockResolvedValueOnce([{ cantidad: 11 }]);

    const repo = new DashboardBloqueTypeormRepository(
      dataSource as unknown as DataSource,
    );

    const result = await repo.getDetailDashboard({
      bloqueId: 101,
      includeInactive: true,
    });

    expect(result?.schemaVersion).toBe(2);
    expect(result?.layout).toEqual({ mode: 'detail' });
    expect(result?.filtersApplied).toEqual({ bloqueId: 101, includeInactive: true });
    expect(result?.data.bloque).toEqual({
      id: 101,
      nombre: 'Bloque A',
      nombreCorto: 'Bloque A',
      activo: true,
      pisos: 4,
      tipoBloqueId: 1,
      tipoBloqueNombre: 'Académico',
      facultadId: 22,
      facultadNombre: 'Facultad de Ingeniería',
      campusId: 1,
      campusNombre: 'Campus Central',
    });
    expect(result?.data.kpis).toEqual({
      ambientes: { total: 12, activos: 10, inactivos: 2 },
      capacidad: { total: 540, examen: 300 },
      activos: { asignados: 68, sinAsignarGlobal: 11 },
    });
    expect(result?.data.charts.tiposAmbiente).toEqual([
      { tipo: 'Aula', cantidad: 8 },
      { tipo: 'Laboratorio', cantidad: 3 },
      { tipo: 'Auditorio', cantidad: 1 },
    ]);
    expect(result?.data.porAmbiente).toHaveLength(2);
    expect(result?.data.porAmbiente[0]).toMatchObject({
      id: 1001,
      nombre: 'Aula 101',
      piso: 1,
      capacidad: { total: 40, examen: 30 },
      tipoAmbiente: 'Aula',
      activos: { asignados: 5 },
    });
  });
});
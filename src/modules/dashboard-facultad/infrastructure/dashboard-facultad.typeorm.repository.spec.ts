// Pruebas del repositorio TypeORM del dashboard de facultad

import type { DataSource } from 'typeorm';
import { DashboardFacultadTypeormRepository } from './dashboard-facultad.typeorm.repository';

const makeMockDataSource = () => {
  return {
    query: jest.fn(),
  } as unknown as jest.Mocked<DataSource>;
};

describe('DashboardFacultadTypeormRepository.getDetailDashboard', () => {
  it('retorna null cuando la facultad no existe según filtros', async () => {
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

  it('mapea el detalle de facultad con nueva estructura (kpis/porBloque)', async () => {
    const dataSource = makeMockDataSource();
    // 1) Facultad base
    (dataSource.query as jest.Mock).mockResolvedValueOnce([
      {
        id: 22,
        nombre: 'Facultad de Ingeniería',
        nombre_corto: 'FI',
        activo: true,
        campus_id: 1,
        campus_nombre: 'Campus Central',
      },
    ]);
    // 2) KPIs y summary
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
    // 3) Tipos de bloque
    (dataSource.query as jest.Mock).mockResolvedValueOnce([
      { tipo_bloque_id: 1, tipo_bloque_nombre: 'Académico', cantidad: 3 },
    ]);
    // 4) Tipos de ambiente
    (dataSource.query as jest.Mock).mockResolvedValueOnce([
      { tipo_ambiente_id: 5, tipo_ambiente_nombre: 'Aula', cantidad: 14 },
    ]);
    // 5) Por bloque
    (dataSource.query as jest.Mock).mockResolvedValueOnce([
      {
        bloque_id: 101,
        bloque_nombre: 'Bloque A',
        ambientes_total: 9,
        ambientes_activos: 8,
        ambientes_inactivos: 1,
        capacidad_total: 300,
        capacidad_examen: 180,
        activos_asignados: 60,
      },
      {
        bloque_id: 102,
        bloque_nombre: 'Bloque B',
        ambientes_total: 11,
        ambientes_activos: 8,
        ambientes_inactivos: 3,
        capacidad_total: 500,
        capacidad_examen: 340,
        activos_asignados: 60,
      },
    ]);
    // 6) Activos no asignados globales
    (dataSource.query as jest.Mock).mockResolvedValueOnce([{ cantidad: 11 }]);

    const repo = new DashboardFacultadTypeormRepository(
      dataSource as unknown as DataSource,
    );

    const result = await repo.getDetailDashboard({
      facultadId: 22,
      includeInactive: true,
    });

    expect(result?.schemaVersion).toBe(2);
    expect(result?.layout).toEqual({ mode: 'detail' });
    expect(result?.filtersApplied).toEqual({ facultadId: 22, includeInactive: true });
    expect(result?.data.facultad).toEqual({
      id: 22,
      nombre: 'Facultad de Ingeniería',
      nombreCorto: 'FI',
      activo: true,
      campusId: 1,
      campusNombre: 'Campus Central',
    });
    expect(result?.data.kpis).toEqual({
      bloques: { total: 4, activos: 3, inactivos: 1 },
      ambientes: { total: 20, activos: 16, inactivos: 4 },
      capacidad: { total: 800, examen: 520 },
      activos: { asignados: 120, sinAsignarGlobal: 11 },
    });
    expect(result?.data.charts.tiposBloque).toEqual([
      { tipo: 'Académico', cantidad: 3 },
    ]);
    expect(result?.data.charts.tiposAmbiente).toEqual([
      { tipo: 'Aula', cantidad: 14 },
    ]);
    expect(result?.data.porBloque).toHaveLength(2);
    expect(result?.data.porBloque[0]).toMatchObject({
      id: 101,
      nombre: 'Bloque A',
      ambientes: 9,
      capacidad: { total: 300, examen: 180 },
      activos: { asignados: 60 },
    });
  });
});
// Pruebas pedag?gicas para el repositorio de ambientes disponibles.
// Validamos que el SQL generado contenga los filtros esperados y que los datos se agrupen por bloque/piso con nombres enriquecidos.

import { TypeormAmbientesDisponiblesRepository } from './typeorm-ambientes-disponibles.repository';
import { ListAmbientesDisponiblesQuery } from '../../domain/ambiente.disponibles.types';

// DataSource falso para no depender de una base real.
const createFakeDataSource = () => ({
  query: jest.fn(),
});

describe('TypeormAmbientesDisponiblesRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('omite filtros cuando no se envian (solo orden y paginaci?n)', async () => {
    const dataSource = createFakeDataSource();
    dataSource.query.mockResolvedValueOnce([]);

    const repository = new TypeormAmbientesDisponiblesRepository(
      dataSource as unknown as any,
    );

    await repository.listDisponibles({
      page: 1,
      take: 10,
      orderBy: 'nombre',
      orderDir: 'asc',
    });

    const [dataSql, dataParams] = dataSource.query.mock.calls[0];
    const normalizedSql = dataSql.replace(/\s+/g, ' ').trim();
    expect(normalizedSql).not.toContain("(a.capacidad->>'total')");
    expect(normalizedSql).not.toContain("(a.capacidad->>'examen')");
    expect(normalizedSql).not.toContain('ANY(');
    expect(normalizedSql).not.toContain(
      'EXISTS ( SELECT 1 FROM infraestructura.horarios',
    );
    expect(normalizedSql).toContain('ORDER BY a.nombre ASC');
    expect(dataParams).toEqual([]);
  });
  it('ordena grupos por capacidad_total cuando se solicita', async () => {
    const dataSource = createFakeDataSource();
    dataSource.query.mockResolvedValueOnce([
      {
        id: 1,
        codigo: 'A1',
        nombre: 'A1',
        nombre_corto: 'A1',
        piso: 0,
        capacidad: { total: 10, examen: 5 },
        clases: true,
        activo: true,
        bloque_id: 1,
        bloque_nombre: 'B1',
        facultad_id: 1,
        facultad_nombre: 'F1',
        campus_id: 1,
        campus_nombre: 'C1',
        tipo_bloque_id: 1,
        tipo_bloque_nombre: 'TB1',
        tipo_ambiente_id: 1,
        tipo_ambiente_nombre: 'Aula',
      },
      {
        id: 2,
        codigo: 'A2',
        nombre: 'A2',
        nombre_corto: 'A2',
        piso: 0,
        capacidad: { total: 30, examen: 15 },
        clases: true,
        activo: true,
        bloque_id: 2,
        bloque_nombre: 'B2',
        facultad_id: 1,
        facultad_nombre: 'F1',
        campus_id: 1,
        campus_nombre: 'C1',
        tipo_bloque_id: 1,
        tipo_bloque_nombre: 'TB1',
        tipo_ambiente_id: 1,
        tipo_ambiente_nombre: 'Aula',
      },
    ]);

    const repository = new TypeormAmbientesDisponiblesRepository(
      dataSource as unknown as any,
    );

    const result = await repository.listDisponibles({
      page: 1,
      take: 10,
      orderBy: 'capacidad_total',
      orderDir: 'desc',
    });

    expect(result.items[0].capacidad_total).toBe(30);
    expect(result.items[1].capacidad_total).toBe(10);
  });
});

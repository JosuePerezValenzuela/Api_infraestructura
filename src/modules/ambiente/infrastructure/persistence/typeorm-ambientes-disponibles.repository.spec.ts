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

  it('construye la consulta con filtros de ids, capacidades y horario agrupando por bloque y piso', async () => {
    const dataSource = createFakeDataSource();
    dataSource.query.mockResolvedValueOnce([
      {
        id: 1,
        codigo: 'AULA-101',
        nombre: 'Aula 101',
        nombre_corto: '101',
        piso: 1,
        capacidad: { total: 40, examen: 25 },
        clases: true,
        activo: true,
        bloque_id: 12,
        bloque_nombre: 'Bloque',
        facultad_id: 11,
        facultad_nombre: 'Facu',
        campus_id: 10,
        campus_nombre: 'Campus',
        tipo_bloque_id: 2,
        tipo_bloque_nombre: 'Tipo bloque',
        tipo_ambiente_id: 3,
        tipo_ambiente_nombre: 'Aula',
      },
      {
        id: 2,
        codigo: 'AULA-102',
        nombre: 'Aula 102',
        nombre_corto: '102',
        piso: 1,
        capacidad: { total: 20, examen: 15 },
        clases: true,
        activo: true,
        bloque_id: 12,
        bloque_nombre: 'Bloque',
        facultad_id: 11,
        facultad_nombre: 'Facu',
        campus_id: 10,
        campus_nombre: 'Campus',
        tipo_bloque_id: 2,
        tipo_bloque_nombre: 'Tipo bloque',
        tipo_ambiente_id: 3,
        tipo_ambiente_nombre: 'Aula',
      },
    ]);

    const repository = new TypeormAmbientesDisponiblesRepository(
      dataSource as unknown as any,
    );

    const query: ListAmbientesDisponiblesQuery = {
      capacidad_min: 30,
      capacidad_examen_min: 20,
      mismo_piso: true,
      tipo_ambiente_ids: [1, 2],
      campus_ids: [10],
      facultad_ids: [11],
      bloque_ids: [12],
      tipo_bloque_ids: [2],
      horario: { dia: 1, hora_inicio: '08:00', hora_fin: '10:00' },
      page: 1,
      take: 10,
      orderBy: 'codigo',
      orderDir: 'desc',
    };

    const result = await repository.listDisponibles(query);

    const [dataSql, dataParams] = dataSource.query.mock.calls[0];
    const normalizedSql = dataSql.replace(/\s+/g, ' ').trim();
    expect(normalizedSql).toContain('FROM infraestructura.ambientes a');
    expect(normalizedSql).toContain(
      'JOIN infraestructura.bloques b ON b.id = a.bloque_id',
    );
    expect(normalizedSql).toContain(
      'JOIN infraestructura.facultades f ON f.id = b.facultad_id',
    );
    expect(normalizedSql).toContain("(a.capacidad->>'total')::int >= $1");
    expect(normalizedSql).not.toContain("(a.capacidad->>'examen')::int");
    expect(normalizedSql).toContain('a.tipo_ambiente_id = ANY($2)');
    expect(normalizedSql).toContain('f.campus_id = ANY($3)');
    expect(normalizedSql).toContain('f.id = ANY($4)');
    expect(normalizedSql).toContain('b.id = ANY($5)');
    expect(normalizedSql).toContain('b.tipo_bloque_id = ANY($6)');
    expect(normalizedSql).toContain(
      'EXISTS (SELECT 1 FROM infraestructura.horarios h WHERE h.ambiente_id = a.id AND h.dia = $7 AND h.hora_inicio <= $8 AND h.hora_fin >= $9)',
    );
    expect(normalizedSql).toContain('ORDER BY a.codigo DESC');
    expect(dataParams).toEqual([
      30,
      [1, 2],
      [10],
      [11],
      [12],
      [2],
      1,
      '08:00',
      '10:00',
    ]);

    expect(result.items).toEqual([
      {
        campus_id: 10,
        campus_nombre: 'Campus',
        facultad_id: 11,
        facultad_nombre: 'Facu',
        bloque_id: 12,
        bloque_nombre: 'Bloque',
        tipo_bloque_id: 2,
        tipo_bloque_nombre: 'Tipo bloque',
        piso: 1,
        capacidad_examen_total: 40,
        ambientes: [
          {
            id: 1,
            codigo: 'AULA-101',
            nombre: 'Aula 101',
            nombre_corto: '101',
            piso: 1,
            capacidad: { total: 40, examen: 25 },
            clases: true,
            activo: true,
            bloque_id: 12,
            bloque_nombre: 'Bloque',
            facultad_id: 11,
            facultad_nombre: 'Facu',
            campus_id: 10,
            campus_nombre: 'Campus',
            tipo_bloque_id: 2,
            tipo_bloque_nombre: 'Tipo bloque',
            tipo_ambiente_id: 3,
            tipo_ambiente_nombre: 'Aula',
          },
          {
            id: 2,
            codigo: 'AULA-102',
            nombre: 'Aula 102',
            nombre_corto: '102',
            piso: 1,
            capacidad: { total: 20, examen: 15 },
            clases: true,
            activo: true,
            bloque_id: 12,
            bloque_nombre: 'Bloque',
            facultad_id: 11,
            facultad_nombre: 'Facu',
            campus_id: 10,
            campus_nombre: 'Campus',
            tipo_bloque_id: 2,
            tipo_bloque_nombre: 'Tipo bloque',
            tipo_ambiente_id: 3,
            tipo_ambiente_nombre: 'Aula',
          },
        ],
      },
    ]);
    expect(result.meta).toEqual({
      total: 1,
      page: 1,
      take: 10,
      hasNextPage: false,
      hasPreviousPage: false,
    });
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
      'EXISTS (SELECT 1 FROM infraestructura.horarios',
    );
    expect(normalizedSql).toContain('ORDER BY a.nombre ASC');
    expect(dataParams).toEqual([]);
  });
});

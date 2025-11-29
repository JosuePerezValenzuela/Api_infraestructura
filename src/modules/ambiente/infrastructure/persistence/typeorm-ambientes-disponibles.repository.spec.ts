// Pruebas pedag?gicas para el repositorio de ambientes disponibles.
// Validamos que el SQL generado contenga los filtros esperados y que los datos se mapeen correctamente.

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

  it('construye la consulta con filtros de ids, capacidades y horario', async () => {
    const dataSource = createFakeDataSource();
    // Primera llamada: datos; segunda llamada: conteo total.
    dataSource.query
      .mockResolvedValueOnce([
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
          facultad_id: 11,
          campus_id: 10,
          tipo_bloque_id: 2,
          tipo_ambiente_id: 3,
        },
      ])
      .mockResolvedValueOnce([{ total: 1 }]);

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
      page: 2,
      take: 5,
      orderBy: 'codigo',
      orderDir: 'desc',
    };

    const result = await repository.listDisponibles(query);

    // Validamos SQL de datos.
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
    expect(normalizedSql).toContain("(a.capacidad->>'examen')::int >= $2");
    expect(normalizedSql).toContain('a.tipo_ambiente_id = ANY($3)');
    expect(normalizedSql).toContain('f.campus_id = ANY($4)');
    expect(normalizedSql).toContain('f.id = ANY($5)');
    expect(normalizedSql).toContain('b.id = ANY($6)');
    expect(normalizedSql).toContain('b.tipo_bloque_id = ANY($7)');
    expect(normalizedSql).toContain(
      'EXISTS (SELECT 1 FROM infraestructura.horarios h WHERE h.ambiente_id = a.id AND h.dia = $8 AND h.hora_inicio <= $9 AND h.hora_fin >= $10)',
    );
    expect(normalizedSql).toContain('ORDER BY a.codigo DESC');
    expect(normalizedSql).toContain('LIMIT $11');
    expect(normalizedSql).toContain('OFFSET $12');
    expect(dataParams).toEqual([
      30,
      20,
      [1, 2],
      [10],
      [11],
      [12],
      [2],
      1,
      '08:00',
      '10:00',
      5,
      5,
    ]);

    // Validamos SQL de conteo (sin paginaci?n).
    const [countSql, countParams] = dataSource.query.mock.calls[1];
    expect(countSql).toContain('SELECT COUNT(*)::int AS total');
    expect(countParams).toEqual([
      30,
      20,
      [1, 2],
      [10],
      [11],
      [12],
      [2],
      1,
      '08:00',
      '10:00',
    ]);

    // Verificamos el mapeo de capacidad y meta.
    expect(result.items).toEqual([
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
        facultad_id: 11,
        campus_id: 10,
        tipo_bloque_id: 2,
        tipo_ambiente_id: 3,
      },
    ]);
    expect(result.meta).toEqual({
      total: 1,
      page: 2,
      take: 5,
      hasNextPage: false,
      hasPreviousPage: true,
    });
  });

  it('omite filtros cuando no se envian (solo paginaci?n y orden por defecto)', async () => {
    const dataSource = createFakeDataSource();
    dataSource.query
      .mockResolvedValueOnce([]) // datos
      .mockResolvedValueOnce([{ total: 0 }]); // conteo

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
    expect(normalizedSql).toContain('LIMIT $1');
    expect(normalizedSql).toContain('OFFSET $2');
    expect(dataParams).toEqual([10, 0]);
  });
});

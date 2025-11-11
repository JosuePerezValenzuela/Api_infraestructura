// Estas pruebas documentan el repositorio TypeormTipoAmbienteRepository paso a paso.
import { DataSource, QueryFailedError } from 'typeorm';
import { ConflictException } from '@nestjs/common';
import { TypeormTipoAmbienteRepository } from './typeorm-tipo-ambiente.repository';

type FakeDataSource = {
  query: jest.Mock;
};

describe('TypeormTipoAmbienteRepository', () => {
  const buildRepository = () => {
    const dataSource: FakeDataSource = {
      query: jest.fn(),
    };
    const repository = new TypeormTipoAmbienteRepository(
      dataSource as unknown as DataSource,
    );
    return { dataSource, repository };
  };

  it('crea un tipo de ambiente y devuelve el id generado', async () => {
    const { dataSource, repository } = buildRepository();
    dataSource.query.mockResolvedValue([{ id: 21 }]);

    const result = await repository.create({
      nombre: 'Laboratorio Clínico',
      descripcion: 'Espacio equipado para análisis clínicos',
      descripcion_corta: 'Lab clínico',
      activo: true,
    });

    const [rawSql, params] = dataSource.query.mock.calls[0];
    const sql = rawSql.replace(/\s+/g, ' ').trim();
    expect(sql).toContain(
      'INSERT INTO infraestructura.tipo_ambientes (nombre, descripcion, descripcion_corta, activo)',
    );
    expect(params).toEqual([
      'Laboratorio Clínico',
      'Espacio equipado para análisis clínicos',
      'Lab clínico',
      true,
    ]);
    expect(result).toEqual({ id: 21 });
  });

  it('lanza ConflictException cuando la BD reporta nombre duplicado', async () => {
    const { dataSource, repository } = buildRepository();
    const driverError = { code: '23505' };
    const queryError = new QueryFailedError('INSERT', [], driverError);
    dataSource.query.mockRejectedValue(queryError);

    await expect(
      repository.create({
        nombre: 'Laboratorio Clínico',
        descripcion: 'Espacio equipado para análisis clínicos',
        descripcion_corta: 'Lab clínico',
        activo: true,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('indica que un nombre está tomado cuando la consulta retorna filas', async () => {
    const { dataSource, repository } = buildRepository();
    dataSource.query.mockResolvedValue([{ existe: 1 }]);

    const taken = await repository.isNameTaken('Laboratorio Clínico');

    const [rawSql, params] = dataSource.query.mock.calls[0];
    const sql = rawSql.replace(/\s+/g, ' ').trim();
    expect(sql).toContain(
      'SELECT 1 AS existe FROM infraestructura.tipo_ambientes WHERE nombre = $1',
    );
    expect(params).toEqual(['Laboratorio Clínico']);
    expect(taken).toBe(true);
  });

  it('indica que un nombre está libre cuando la consulta no devuelve filas', async () => {
    const { dataSource, repository } = buildRepository();
    dataSource.query.mockResolvedValue([]);

    const taken = await repository.isNameTaken('Laboratorio Clínico');

    const [rawSql] = dataSource.query.mock.calls[0];
    const sql = rawSql.replace(/\s+/g, ' ').trim();
    expect(sql).toContain(
      'SELECT 1 AS existe FROM infraestructura.tipo_ambientes WHERE nombre = $1',
    );
    expect(taken).toBe(false);
  });

  it('lista tipos de ambiente con paginación por defecto', async () => {
    const { dataSource, repository } = buildRepository();
    dataSource.query
      .mockResolvedValueOnce([
        {
          id: 1,
          nombre: 'Laboratorio',
          descripcion: 'Espacio científico',
          descripcion_corta: 'Lab',
          activo: true,
          creado_en: '2025-09-24T15:20:30.767Z',
          actualizado_en: '2025-09-24T15:25:30.767Z',
        },
      ])
      .mockResolvedValueOnce([{ total: 1 }]);

    const result = await repository.list({
      page: 1,
      take: 8,
      search: null,
      orderBy: 'nombre',
      orderDir: 'asc',
    });

    const [selectSql, selectParams] = dataSource.query.mock.calls[0];
    expect(selectSql.replace(/\s+/g, ' ').trim()).toContain(
      'FROM infraestructura.tipo_ambientes',
    );
    expect(selectParams).toEqual([8, 0]);

    const [countSql, countParams] = dataSource.query.mock.calls[1];
    expect(countSql.replace(/\s+/g, ' ').trim()).toContain(
      'SELECT COUNT(*)::int AS total FROM infraestructura.tipo_ambientes',
    );
    expect(countParams).toEqual([]);

    expect(result.items[0]).toMatchObject({
      id: 1,
      nombre: 'Laboratorio',
      descripcion_corta: 'Lab',
      activo: true,
    });
    expect(result.meta.total).toBe(1);
  });

  it('aplica búsqueda y ordenamiento descendente', async () => {
    const { dataSource, repository } = buildRepository();
    dataSource.query
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ total: 0 }]);

    await repository.list({
      page: 2,
      take: 5,
      search: 'lab',
      orderBy: 'creado_en',
      orderDir: 'desc',
    });

    const [selectSql, selectParams] = dataSource.query.mock.calls[0];
    expect(selectSql.replace(/\s+/g, ' ').trim()).toContain('ILIKE $1');
    expect(selectSql).toContain('ORDER BY ta.creado_en DESC');
    expect(selectParams).toEqual(['%lab%', 5, 5]);

    const [countSql, countParams] = dataSource.query.mock.calls[1];
    expect(countSql.replace(/\s+/g, ' ').trim()).toContain('ILIKE $1');
    expect(countParams).toEqual(['%lab%']);
  });
});

// Este archivo describe con detalle como debe comportarse TypeormActivoRepository.
// Las pruebas usan un DataSource falso para inspeccionar las consultas sin tocar una base real.

import { ConflictException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { TypeormActivoRepository } from './typeorm-activo.repository';
import { ListActivosOptions } from '../../domain/activo.list.types';
import { CreateActivoCommand } from '../../domain/commands/create-activo.command';

// Fabrica un DataSource falso con jest.fn para espiar llamadas a query.
const createFakeDataSource = () => ({
  query: jest.fn(),
});

describe('TypeormActivoRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('inserta un activo y devuelve su id', async () => {
    // Arrange: simulamos que la base devuelve id 9 tras el insert.
    const dataSource = createFakeDataSource();
    dataSource.query.mockResolvedValueOnce([{ id: '9' }]);
    const repository = new TypeormActivoRepository(
      dataSource as unknown as any,
    );
    // Comando de ejemplo para insertar.
    const command: CreateActivoCommand = {
      nia: 'NIA-9999',
      nombre: 'Impresora',
      descripcion: 'Laser monocromatica',
      ambiente_id: 2,
    };

    // Act: ejecutamos create.
    const result = await repository.create(command);

    // Assert: se llamo al query con el SQL de insert y los parametros correctos.
    const [sql, params] = dataSource.query.mock.calls[0];
    const normalizedSql = (sql as string).replace(/\s+/g, ' ').trim();
    expect(normalizedSql).toContain(
      'INSERT INTO infraestructura.activos ( nia, nombre, descripcion, ambiente_id )',
    );
    expect(params).toEqual([
      'NIA-9999',
      'Impresora',
      'Laser monocromatica',
      2,
    ]);
    expect(result).toEqual({ id: 9 });
  });

  it('lanza ConflictException cuando postgres reporta clave duplicada', async () => {
    // Arrange: simulamos un error 23505 de Postgres.
    const dataSource = createFakeDataSource();
    const driverError = { code: '23505' };
    const queryError = new QueryFailedError(
      'insert',
      [],
      driverError as unknown as Error,
    );
    dataSource.query.mockRejectedValueOnce(queryError);
    const repository = new TypeormActivoRepository(
      dataSource as unknown as any,
    );

    // Act & Assert: create debe convertirlo en ConflictException.
    await expect(
      repository.create({
        nia: 'NIA-dup',
        nombre: 'Duplicado',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('detecta si un NIA ya existe', async () => {
    // Arrange: devolvemos una fila para simular existencia.
    const dataSource = createFakeDataSource();
    dataSource.query.mockResolvedValueOnce([{ existe: 1 }]);
    const repository = new TypeormActivoRepository(
      dataSource as unknown as any,
    );

    // Act: consultamos por el NIA.
    const exists = await repository.isNiaTaken('NIA-0001');

    // Assert: debe devolver true y usar LIMIT en la consulta.
    const [sql, params] = dataSource.query.mock.calls[0];
    expect(sql).toContain('LIMIT 1');
    expect(params).toEqual(['NIA-0001']);
    expect(exists).toBe(true);
  });

  it('devuelve items paginados y metadatos correctos', async () => {
    // Arrange: simulamos dos llamadas a query: una para datos y otra para el total.
    const dataSource = createFakeDataSource();
    dataSource.query
      .mockResolvedValueOnce([
        {
          id: 1,
          nia: 'NIA-0001',
          nombre: 'Proyector Epson X12',
          descripcion: 'Proyector principal del auditorio central',
          creado_en: '2025-11-10T12:00:00.000Z',
          ambiente_id: 4,
          ambiente_nombre: 'Auditorio central',
          ambiente_codigo: 'AUD-001',
        },
      ])
      .mockResolvedValueOnce([{ total: 1 }]);
    const repository = new TypeormActivoRepository(
      dataSource as unknown as any,
    );

    // Act: ejecutamos el listado con filtros basicos.
    const options: ListActivosOptions = {
      page: 1,
      take: 10,
      search: null,
      orderBy: 'nombre',
      orderDir: 'asc',
      ambienteId: null,
    };
    const result = await repository.list(options);

    // Assert: se llamo dos veces a query (datos y conteo).
    expect(dataSource.query).toHaveBeenCalledTimes(2);
    // Revisamos que limit y offset se pasen al final de los parametros.
    const [, params] = dataSource.query.mock.calls[0];
    expect(params.slice(-2)).toEqual([10, 0]);
    // Validamos el mapeo de salida y los meta flags de paginacion.
    expect(result).toEqual({
      items: [
        {
          id: 1,
          nia: 'NIA-0001',
          nombre: 'Proyector Epson X12',
          descripcion: 'Proyector principal del auditorio central',
          creado_en: '2025-11-10T12:00:00.000Z',
          ambiente_id: 4,
          ambiente_nombre: 'Auditorio central',
          ambiente_codigo: 'AUD-001',
        },
      ],
      meta: {
        total: 1,
        page: 1,
        take: 10,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });
  });

  it('agrega filtros de search y ambienteId en la consulta SQL', async () => {
    // Arrange: preparamos el dataSource falso y una respuesta vacia para simplificar.
    const dataSource = createFakeDataSource();
    dataSource.query.mockResolvedValueOnce([]).mockResolvedValueOnce([{ total: 0 }]);
    const repository = new TypeormActivoRepository(
      dataSource as unknown as any,
    );

    // Act: ejecutamos con search y ambienteId para observar la clausula WHERE.
    const options: ListActivosOptions = {
      page: 2,
      take: 5,
      search: 'router',
      orderBy: 'nia',
      orderDir: 'desc',
      ambienteId: 7,
    };
    await repository.list(options);

    // Assert: obtenemos el SQL y lo normalizamos quitando espacios extra.
    const [sql, params] = dataSource.query.mock.calls[0];
    const normalizedSql = (sql as string).replace(/\s+/g, ' ').trim().toLowerCase();
    // Debe contener el filtro de busqueda sobre nia, nombre o descripcion.
    expect(normalizedSql).toContain(
      '(a.nia ilike $1 or a.nombre ilike $2 or a.descripcion ilike $3)',
    );
    // Tambien debe incluir el filtro por ambiente_id.
    expect(normalizedSql).toContain('a.ambiente_id = $4');
    // Los parametros deben respetar el orden: patron de search, patron de search, patron de search, ambienteId, take, offset.
    expect(params).toEqual(['%router%', '%router%', '%router%', 7, 5, 5]);
  });
});

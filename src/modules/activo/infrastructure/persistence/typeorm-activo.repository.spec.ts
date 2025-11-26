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
    expect(params).toEqual(['NIA-9999', 'Impresora', 'Laser monocromatica', 2]);
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

  it('detecta NIA excluyendo el propio id cuando se actualiza', async () => {
    // Arrange: simulamos la consulta con excludeId.
    const dataSource = createFakeDataSource();
    dataSource.query.mockResolvedValueOnce([]);
    const repository = new TypeormActivoRepository(
      dataSource as unknown as any,
    );

    // Act: llamamos con excludeId=5.
    await repository.isNiaTaken('NIA-2', 5);

    // Assert: la consulta debe incluir la clausula id <> $2 y los parametros correctos.
    const [sql, params] = dataSource.query.mock.calls[0];
    expect(sql).toContain('id <> $2');
    expect(params).toEqual(['NIA-2', 5]);
  });

  it('busca un activo por id y devuelve null si no existe', async () => {
    // Arrange: simulamos que no hay filas.
    const dataSource = createFakeDataSource();
    dataSource.query.mockResolvedValueOnce([]);
    const repository = new TypeormActivoRepository(
      dataSource as unknown as any,
    );

    // Act: buscamos un id inexistente.
    const found = await repository.findById(33);

    // Assert: se consultГі con limit 1 y devuelve null.
    const [sql, params] = dataSource.query.mock.calls[0];
    expect(sql).toContain('LIMIT 1');
    expect(params).toEqual([33]);
    expect(found).toBeNull();
  });

  it('elimina un activo y devuelve su id', async () => {
    // Arrange: simulamos que el delete devuelve el id.
    const dataSource = createFakeDataSource();
    dataSource.query.mockResolvedValueOnce([{ id: 5 }]);
    const repository = new TypeormActivoRepository(
      dataSource as unknown as any,
    );

    // Act: ejecutamos delete.
    const result = await repository.delete({ id: 5 });

    // Assert: se usa RETURNING id y se normaliza a numero.
    const [sql, params] = dataSource.query.mock.calls[0];
    const normalizedSql = (sql as string).replace(/\s+/g, ' ').trim();
    expect(normalizedSql).toContain(
      'DELETE FROM infraestructura.activos WHERE id = $1 RETURNING id',
    );
    expect(params).toEqual([5]);
    expect(result).toEqual({ id: 5 });
  });

  it('actualiza los campos enviados y devuelve el id', async () => {
    // Arrange: preparamos el dataSource con una fila devuelta.
    const dataSource = createFakeDataSource();
    dataSource.query.mockResolvedValueOnce([{ id: 11 }]);
    const repository = new TypeormActivoRepository(
      dataSource as unknown as any,
    );

    // Act: ejecutamos update con nia y descripcion.
    const result = await repository.update({
      id: 11,
      nia: 'NIA-500',
      descripcion: 'Actualizado',
    });

    // Assert: revisamos el SQL y los parametros.
    const [sql, params] = dataSource.query.mock.calls[0];
    const normalizedSql = (sql as string).replace(/\s+/g, ' ').trim();
    expect(normalizedSql).toContain('UPDATE infraestructura.activos');
    expect(normalizedSql).toContain('nia = $1');
    expect(normalizedSql).toContain('descripcion = $2');
    expect(params).toEqual(['NIA-500', 'Actualizado', 11]);
    expect(result).toEqual({ id: 11 });
  });

  it('asigna varios activos a un ambiente y devuelve los ids actualizados', async () => {
    // Arrange: simulamos que se actualizan 2 activos.
    const dataSource = createFakeDataSource();
    dataSource.query.mockResolvedValueOnce([{ id: 1 }, { id: 2 }]);
    const repository = new TypeormActivoRepository(
      dataSource as unknown as any,
    );

    // Act: llamamos al metodo de asignacion.
    const result = await repository.assignToAmbiente(5, [1, 2]);

    // Assert: verificamos SQL, parametros y retorno.
    const [sql, params] = dataSource.query.mock.calls[0];
    const normalizedSql = (sql as string)
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
    expect(normalizedSql).toContain('update infraestructura.activos');
    expect(normalizedSql).toContain('where id = any($2::int[])');
    expect(params).toEqual([5, [1, 2]]);
    expect(result).toEqual({ updatedIds: [1, 2] });
  });

  it('lanza ConflictException en update cuando hay clave duplicada', async () => {
    // Arrange: simulamos error 23505.
    const dataSource = createFakeDataSource();
    const driverError = { code: '23505' };
    const queryError = new QueryFailedError(
      'update',
      [],
      driverError as unknown as Error,
    );
    dataSource.query.mockRejectedValueOnce(queryError);
    const repository = new TypeormActivoRepository(
      dataSource as unknown as any,
    );

    // Act & Assert.
    await expect(
      repository.update({ id: 3, nia: 'NIA-dup' }),
    ).rejects.toBeInstanceOf(ConflictException);
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
    dataSource.query
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ total: 0 }]);
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
    const normalizedSql = (sql as string)
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
    // Debe contener el filtro de busqueda sobre nia, nombre o descripcion.
    expect(normalizedSql).toContain(
      '(a.nia ilike $1 or a.nombre ilike $2 or a.descripcion ilike $3)',
    );
    // Tambien debe incluir el filtro por ambiente_id.
    expect(normalizedSql).toContain('a.ambiente_id = $4');
    // Los parametros deben respetar el orden: patron de search, patron de search, patron de search, ambienteId, take, offset.
    expect(params).toEqual(['%router%', '%router%', '%router%', 7, 5, 5]);
  });

  it('busca un activo por NIA y devuelve su id cuando existe', async () => {
    // Arrange: el dataSource devolvera una fila con id 11.
    const dataSource = createFakeDataSource();
    dataSource.query.mockResolvedValueOnce([{ id: 11 }]);
    const repository = new TypeormActivoRepository(
      dataSource as unknown as any,
    );

    // Act: invocamos findByNia.
    const result = await repository.findByNia('NIA-11');

    // Assert: la consulta debe filtrar por nia y retornar el id numerico.
    const [sql, params] = dataSource.query.mock.calls[0];
    const normalizedSql = (sql as string).replace(/\s+/g, ' ').trim();
    expect(normalizedSql).toContain('FROM infraestructura.activos');
    expect(params).toEqual(['NIA-11']);
    expect(result).toEqual({ id: 11 });
  });

  it('indica null cuando findByNia no encuentra registros', async () => {
    // Arrange: la consulta no devuelve filas.
    const dataSource = createFakeDataSource();
    dataSource.query.mockResolvedValueOnce([]);
    const repository = new TypeormActivoRepository(
      dataSource as unknown as any,
    );

    // Act.
    const result = await repository.findByNia('NIA-404');

    // Assert.
    expect(result).toBeNull();
  });

  it('verifica la existencia de un ambiente antes de operar', async () => {
    // Arrange: simulamos que la consulta devuelve una fila.
    const dataSource = createFakeDataSource();
    dataSource.query.mockResolvedValueOnce([{ existe: 1 }]);
    const repository = new TypeormActivoRepository(
      dataSource as unknown as any,
    );

    // Act: consultamos si existe el ambiente 7.
    const exists = await repository.existsAmbiente(7);

    // Assert: revisamos SQL y resultado booleano.
    const [sql, params] = dataSource.query.mock.calls[0];
    const normalizedSql = (sql as string)
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
    expect(normalizedSql).toContain('from infraestructura.ambientes');
    expect(params).toEqual([7]);
    expect(exists).toBe(true);
  });
});

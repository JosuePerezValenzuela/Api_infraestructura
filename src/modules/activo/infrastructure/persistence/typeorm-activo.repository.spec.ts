// Este archivo describe con detalle como debe comportarse TypeormActivoRepository.
// Las pruebas usan un DataSource falso para inspeccionar las consultas sin tocar una base real.

import { TypeormActivoRepository } from './typeorm-activo.repository';
import { ListActivosOptions } from '../../domain/activo.list.types';

// Fabrica un DataSource falso con jest.fn para espiar llamadas a query.
const createFakeDataSource = () => ({
  query: jest.fn(),
});

describe('TypeormActivoRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

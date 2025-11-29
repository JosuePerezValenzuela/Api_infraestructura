// Pruebas educativas para el método findDetailsByNia del repositorio TypeORM.
// Cada caso muestra cómo debería generarse la consulta y qué devolver.
import { TypeormActivoRepository } from './typeorm-activo.repository';

const createFakeDataSource = () => ({
  query: jest.fn(),
});

describe('TypeormActivoRepository.findDetailsByNia', () => {
  it('retorna los datos del activo junto al ambiente cuando existe', async () => {
    // Arrange: simulamos una respuesta de la BD con join a ambientes.
    const dataSource = createFakeDataSource();
    dataSource.query.mockResolvedValueOnce([
      {
        id: 3,
        nia: 'NIA-003',
        nombre: 'Proyector',
        descripcion: 'Sala A',
        ambiente_id: 2,
        ambiente_nombre: 'Auditorio',
      },
    ]);
    const repo = new TypeormActivoRepository(dataSource as any);

    // Act: buscamos por la NIA.
    const result = await repo.findDetailsByNia('NIA-003');

    // Assert: verificamos SQL, parámetros y mapping.
    const [sql, params] = dataSource.query.mock.calls[0];
    const normalizedSql = (sql as string)
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
    expect(normalizedSql).toContain('from infraestructura.activos');
    expect(normalizedSql).toContain('left join infraestructura.ambientes');
    expect(params).toEqual(['NIA-003']);
    expect(result).toEqual({
      id: 3,
      nia: 'NIA-003',
      nombre: 'Proyector',
      descripcion: 'Sala A',
      ambiente_id: 2,
      ambiente_nombre: 'Auditorio',
    });
  });

  it('devuelve null cuando no encuentra registros', async () => {
    // Arrange: la consulta no devuelve filas.
    const dataSource = createFakeDataSource();
    dataSource.query.mockResolvedValueOnce([]);
    const repo = new TypeormActivoRepository(dataSource as any);

    // Act.
    const result = await repo.findDetailsByNia('NIA-404');

    // Assert.
    expect(result).toBeNull();
  });
});

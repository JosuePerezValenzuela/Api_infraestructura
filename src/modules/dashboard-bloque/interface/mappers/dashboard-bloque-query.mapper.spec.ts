import { DashboardBloqueQueryMapper } from './dashboard-bloque-query.mapper';

describe('DashboardBloqueQueryMapper', () => {
  let mapper: DashboardBloqueQueryMapper;

  beforeEach(() => {
    mapper = new DashboardBloqueQueryMapper();
  });

  it('convierte CSVs y aplica defaults cuando faltan parametros', () => {
    const filters = mapper.toGlobalFilters({
      campusIds: '1,2,3',
      facultadIds: '10,11',
      bloqueIds: '100,101',
      tipoBloqueIds: '1,2',
    });

    expect(filters).toEqual({
      campusIds: [1, 2, 3],
      facultadIds: [10, 11],
      bloqueIds: [100, 101],
      tipoBloqueIds: [1, 2],
      includeInactive: true,
    });
  });

  it('convierte includeInactive', () => {
    const filters = mapper.toGlobalFilters({
      includeInactive: 'false',
    });

    expect(filters).toMatchObject({
      includeInactive: false,
    });
  });

  it('lanza VALIDATION_ERROR cuando bloqueIds no es CSV valido', () => {
    expect(() => mapper.toGlobalFilters({ bloqueIds: '1,a' })).toThrow(
      expect.objectContaining({
        response: {
          error: 'VALIDATION_ERROR',
          message: 'Los datos enviados no son validos',
          details: [
            {
              field: 'bloqueIds',
              message:
                'El parametro bloqueIds debe ser una lista de enteros separados por coma',
            },
          ],
        },
        status: 400,
      }),
    );
  });
});

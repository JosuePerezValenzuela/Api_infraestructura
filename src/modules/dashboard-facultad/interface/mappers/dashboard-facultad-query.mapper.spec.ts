// Pruebas unitarias para el mapper de query params del dashboard-facultad

import { DashboardFacultadQueryMapper } from './dashboard-facultad-query.mapper';

describe('DashboardFacultadQueryMapper', () => {
  let mapper: DashboardFacultadQueryMapper;

  beforeEach(() => {
    mapper = new DashboardFacultadQueryMapper();
  });

  describe('toDetailFilters', () => {
    it('convierte facultadId y aplica defaults para includeInactive', () => {
      const filters = mapper.toDetailFilters('22', {});

      expect(filters).toEqual({
        facultadId: 22,
        includeInactive: true,
      });
    });

    it('lanza VALIDATION_ERROR cuando facultadId no es entero positivo', () => {
      expect(() => mapper.toDetailFilters('abc', {})).toThrow(
        expect.objectContaining({
          response: {
            error: 'VALIDATION_ERROR',
            message: 'Los datos enviados no son validos',
            details: [
              {
                field: 'facultadId',
                message: 'El parametro facultadId debe ser un entero positivo',
              },
            ],
          },
          status: 400,
        }),
      );
    });
  });
});
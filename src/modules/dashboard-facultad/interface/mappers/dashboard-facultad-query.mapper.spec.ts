// En este archivo escribimos pruebas unitarias para el mapper de query params del dashboard-facultad.
// El objetivo es asegurar que el mapper convierta strings HTTP en filtros tipados del dominio.

import { DashboardFacultadQueryMapper } from './dashboard-facultad-query.mapper';

describe('DashboardFacultadQueryMapper', () => {
  let mapper: DashboardFacultadQueryMapper;

  beforeEach(() => {
    mapper = new DashboardFacultadQueryMapper();
  });

  describe('toGlobalFilters', () => {
    it('convierte CSVs y aplica defaults cuando faltan parametros opcionales', () => {
      const filters = mapper.toGlobalFilters({
        campusIds: '1,2,3',
        facultadIds: '10,11',
      });

      expect(filters).toEqual({
        campusIds: [1, 2, 3],
        facultadIds: [10, 11],
        includeInactive: true,
      });
    });

    it('convierte includeInactive=false (texto) a boolean false sin usar Boolean(string)', () => {
      const filters = mapper.toGlobalFilters({
        includeInactive: 'False',
      });

      expect(filters.includeInactive).toBe(false);
    });

    it('lanza VALIDATION_ERROR cuando campusIds no es un CSV de enteros positivos', () => {
      expect(() =>
        mapper.toGlobalFilters({
          campusIds: 'a,b',
        }),
      ).toThrow(
        expect.objectContaining({
          response: {
            error: 'VALIDATION_ERROR',
            message: 'Los datos enviados no son validos',
            details: [
              {
                field: 'campusIds',
                message:
                  'El parametro campusIds debe ser una lista de enteros separados por coma',
              },
            ],
          },
          status: 400,
        }),
      );
    });
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

import { DashboardBloqueQueryMapper } from './dashboard-bloque-query.mapper';

describe('DashboardBloqueQueryMapper', () => {
  let mapper: DashboardBloqueQueryMapper;

  beforeEach(() => {
    mapper = new DashboardBloqueQueryMapper();
  });

  describe('toDetailFilters', () => {
    it('convierte bloqueId y query params correctamente', () => {
      const filters = mapper.toDetailFilters('101', {
        includeInactive: 'false',
      });

      expect(filters).toEqual({
        bloqueId: 101,
        includeInactive: false,
      });
    });

    it('applica includeInactive por defecto', () => {
      const filters = mapper.toDetailFilters('101', {});

      expect(filters).toEqual({
        bloqueId: 101,
        includeInactive: true,
      });
    });

    it('lanza VALIDATION_ERROR cuando bloqueId no es valido', () => {
      expect(() => mapper.toDetailFilters('abc', {})).toThrow(
        expect.objectContaining({
          response: {
            error: 'VALIDATION_ERROR',
            message: 'Los datos enviados no son validos',
            details: [
              {
                field: 'bloqueId',
                message: 'El parámetro bloqueId debe ser un entero positivo',
              },
            ],
          },
          status: 400,
        }),
      );
    });

    it('lanza VALIDATION_ERROR cuando bloqueId es negativo', () => {
      expect(() => mapper.toDetailFilters('-5', {})).toThrow(
        expect.objectContaining({
          response: {
            error: 'VALIDATION_ERROR',
            message: 'Los datos enviados no son validos',
            details: [
              {
                field: 'bloqueId',
                message: 'El parámetro bloqueId debe ser un entero positivo',
              },
            ],
          },
          status: 400,
        }),
      );
    });
  });
});
// En este archivo escribimos pruebas unitarias para el mapper de query params del dashboard-facultad.
// El objetivo es asegurar que el mapper convierta strings HTTP en filtros tipados del dominio.

// Importamos la clase que implementara la conversion y validacion de query params.
import { DashboardFacultadQueryMapper } from './dashboard-facultad-query.mapper';

describe('DashboardFacultadQueryMapper', () => {
  // Guardamos una instancia del mapper para reutilizarla en todas las pruebas.
  let mapper: DashboardFacultadQueryMapper;

  beforeEach(() => {
    // Creamos una instancia nueva antes de cada test para evitar efectos compartidos.
    mapper = new DashboardFacultadQueryMapper();
  });

  describe('toGlobalFilters', () => {
    it('convierte CSVs y aplica defaults cuando faltan parametros opcionales', () => {
      // Ejecutamos el mapper con campusIds y facultadIds en formato CSV.
      const filters = mapper.toGlobalFilters({
        campusIds: '1,2,3',
        facultadIds: '10,11',
      });

      // Verificamos que el mapper convierta correctamente strings a tipos de dominio.
      expect(filters).toEqual({
        campusIds: [1, 2, 3],
        facultadIds: [10, 11],
        includeInactive: true,
        slotMinutes: 45,
        dias: [0, 1, 2, 3, 4, 5, 6],
      });
    });

    it('convierte includeInactive=false (texto) a boolean false sin usar Boolean(string)', () => {
      // Enviamos explicitamente el string "False" para validar parseo robusto case-insensitive.
      const filters = mapper.toGlobalFilters({
        includeInactive: 'False',
      });

      // El valor esperado es false real, no true por truthy de string.
      expect(filters.includeInactive).toBe(false);
    });

    it('convierte slotMinutes y dias cuando llegan en query', () => {
      // Ejecutamos el mapper con parametros numericos en string y dias como CSV.
      const filters = mapper.toGlobalFilters({
        slotMinutes: '60',
        dias: '1,2,3,4,5',
      });

      // Validamos conversion correcta de numero y arreglo de dias.
      expect(filters).toMatchObject({
        slotMinutes: 60,
        dias: [1, 2, 3, 4, 5],
      });
    });

    it('lanza VALIDATION_ERROR cuando campusIds no es un CSV de enteros positivos', () => {
      // Ejecutamos una entrada invalida para forzar la excepcion de validacion.
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

    it('lanza VALIDATION_ERROR cuando slotMinutes no esta permitido', () => {
      // Enviamos un valor fuera del catalogo permitido para el slot.
      expect(() =>
        mapper.toGlobalFilters({
          slotMinutes: '50',
        }),
      ).toThrow(
        expect.objectContaining({
          response: {
            error: 'VALIDATION_ERROR',
            message: 'Los datos enviados no son validos',
            details: [
              {
                field: 'slotMinutes',
                message:
                  'El parametro slotMinutes debe ser uno de los valores permitidos: 15,30,45,60',
              },
            ],
          },
          status: 400,
        }),
      );
    });

    it('lanza VALIDATION_ERROR cuando dias contiene un valor fuera de 0..6', () => {
      // Enviamos un dia invalido para verificar el control de rango.
      expect(() =>
        mapper.toGlobalFilters({
          dias: '0,1,7',
        }),
      ).toThrow(
        expect.objectContaining({
          response: {
            error: 'VALIDATION_ERROR',
            message: 'Los datos enviados no son validos',
            details: [
              {
                field: 'dias',
                message:
                  'El parametro dias debe ser una lista de enteros entre 0 y 6 separados por coma',
              },
            ],
          },
          status: 400,
        }),
      );
    });
  });

  describe('toDetailFilters', () => {
    it('convierte facultadId y aplica defaults para includeInactive, slotMinutes y dias', () => {
      // Ejecutamos el mapper enviando facultadId como string tal como llega por URL.
      const filters = mapper.toDetailFilters('22', {});

      // Validamos el objeto de salida tipado para el caso de uso de detalle.
      expect(filters).toEqual({
        facultadId: 22,
        includeInactive: true,
        slotMinutes: 45,
        dias: [0, 1, 2, 3, 4, 5, 6],
      });
    });

    it('lanza VALIDATION_ERROR cuando facultadId no es entero positivo', () => {
      // Forzamos el error con un valor no numerico.
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

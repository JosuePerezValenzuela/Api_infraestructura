// En este archivo definimos las pruebas del controlador de dashboard por facultad.
// Cada prueba describe el comportamiento esperado antes de implementar el controlador real.

// Importamos utilidades de pruebas de Nest para crear un modulo con dependencias simuladas.
import { Test, TestingModule } from '@nestjs/testing';
// Importamos el controlador que vamos a probar.
import { DashboardFacultadController } from './dashboard-facultad.controller';
// Importamos los casos de uso para reemplazarlos con mocks y verificar llamadas.
import { GetFacultadDashboardGlobalUseCase } from '../application/get-facultad-dashboard-global.usecase';
import { GetFacultadDashboardDetailUseCase } from '../application/get-facultad-dashboard-detail.usecase';

// Definimos el tipo del mock del caso de uso global.
type GlobalUseCaseMock = { execute: jest.Mock };
// Definimos el tipo del mock del caso de uso detalle.
type DetailUseCaseMock = { execute: jest.Mock };

describe('DashboardFacultadController', () => {
  // Guardamos la instancia del controlador creada por Nest durante las pruebas.
  let controller: DashboardFacultadController;
  // Guardamos el mock del caso de uso global para inspeccionar sus llamadas.
  let globalUseCase: GlobalUseCaseMock;
  // Guardamos el mock del caso de uso detalle.
  let detailUseCase: DetailUseCaseMock;

  beforeEach(async () => {
    // Creamos el mock del caso de uso global con un metodo execute espiable.
    globalUseCase = { execute: jest.fn() };
    // Creamos el mock del caso de uso detalle con un metodo execute espiable.
    detailUseCase = { execute: jest.fn() };

    // Creamos un modulo de pruebas registrando el controlador y sus dependencias mockeadas.
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardFacultadController],
      providers: [
        { provide: GetFacultadDashboardGlobalUseCase, useValue: globalUseCase },
        { provide: GetFacultadDashboardDetailUseCase, useValue: detailUseCase },
      ],
    }).compile();

    // Obtenemos la instancia lista del controlador para ejecutar los metodos.
    controller = module.get(DashboardFacultadController);
  });

  describe('getGlobalDashboard', () => {
    it('parsea campusIds y facultadIds en CSV, usa defaults y delega al caso de uso global', async () => {
      // Simulamos una respuesta valida del caso de uso global.
      const mockResult = {
        schemaVersion: 2,
        filtersApplied: {
          campusIds: [1, 2],
          facultadIds: [10, 11],
          includeInactive: true,
          slotMinutes: 45,
          dias: [0, 1, 2, 3, 4, 5, 6],
        },
        layout: { mode: 'global' as const },
        data: { kpis: {}, charts: {}, tables: {} },
      };
      // Configuramos el mock para que devuelva el payload simulado.
      globalUseCase.execute.mockResolvedValue(mockResult);

      // Llamamos al controlador como si viniera una peticion HTTP con query params string.
      const response = await controller.getGlobalDashboard({
        campusIds: '1,2',
        facultadIds: '10,11',
      });

      // Verificamos que los filtros lleguen transformados al caso de uso.
      expect(globalUseCase.execute).toHaveBeenCalledWith({
        campusIds: [1, 2],
        facultadIds: [10, 11],
        includeInactive: true,
        slotMinutes: 45,
        dias: [0, 1, 2, 3, 4, 5, 6],
      });
      // Verificamos que el controlador retorne exactamente lo que responde el caso de uso.
      expect(response).toEqual(mockResult);
    });

    it('convierte includeInactive, slotMinutes y dias cuando vienen en el query', async () => {
      // Simulamos una respuesta donde los filtros ya fueron normalizados por el controlador.
      const mockResult = {
        schemaVersion: 2,
        filtersApplied: {
          campusIds: undefined,
          facultadIds: undefined,
          includeInactive: false,
          slotMinutes: 60,
          dias: [1, 2, 3, 4, 5],
        },
        layout: { mode: 'global' as const },
        data: { kpis: {}, charts: {}, tables: {} },
      };
      // Configuramos el mock para que retorne el resultado esperado.
      globalUseCase.execute.mockResolvedValue(mockResult);

      // Ejecutamos el endpoint con query params en texto.
      await controller.getGlobalDashboard({
        includeInactive: 'false',
        slotMinutes: '60',
        dias: '1,2,3,4,5',
      });

      // Verificamos parseo correcto de boolean, number y lista de dias.
      expect(globalUseCase.execute).toHaveBeenCalledWith({
        campusIds: undefined,
        facultadIds: undefined,
        includeInactive: false,
        slotMinutes: 60,
        dias: [1, 2, 3, 4, 5],
      });
    });

    it('lanza VALIDATION_ERROR cuando campusIds no es CSV de enteros positivos', async () => {
      // Enviamos campusIds invalido para forzar validacion y revisar formato de error estandar.
      await expect(
        controller.getGlobalDashboard({ campusIds: 'a,b' }),
      ).rejects.toMatchObject({
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
      });
    });

    it('lanza VALIDATION_ERROR cuando slotMinutes no es un valor permitido', async () => {
      // Enviamos un valor invalido para slotMinutes segun el contrato definido.
      await expect(
        controller.getGlobalDashboard({ slotMinutes: '50' }),
      ).rejects.toMatchObject({
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
      });
    });

    it('lanza VALIDATION_ERROR cuando dias contiene valores fuera del rango 0..6', async () => {
      // Enviamos un dia invalido para asegurar que solo se acepten dias de la semana de 0 a 6.
      await expect(
        controller.getGlobalDashboard({ dias: '0,1,7' }),
      ).rejects.toMatchObject({
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
      });
    });
  });

  describe('getDetailDashboard', () => {
    it('parsea facultadId y query params, aplica defaults y delega al caso de uso detalle', async () => {
      // Simulamos la respuesta del caso de uso detalle.
      const mockResult = {
        schemaVersion: 2,
        filtersApplied: {
          facultadId: 22,
          includeInactive: true,
          slotMinutes: 45,
          dias: [0, 1, 2, 3, 4, 5, 6],
        },
        layout: { mode: 'detail' as const },
        data: { facultad: {}, kpis: {}, charts: {}, tables: {} },
      };
      // El mock devuelve el resultado simulado.
      detailUseCase.execute.mockResolvedValue(mockResult);

      // Ejecutamos con facultadId en string, como llega por HTTP.
      const response = await controller.getDetailDashboard('22' as any, {});

      // Confirmamos que el controlador transforma y delega correctamente.
      expect(detailUseCase.execute).toHaveBeenCalledWith({
        facultadId: 22,
        includeInactive: true,
        slotMinutes: 45,
        dias: [0, 1, 2, 3, 4, 5, 6],
      });
      // El controlador debe retornar la respuesta del caso de uso sin alteraciones.
      expect(response).toEqual(mockResult);
    });

    it('lanza VALIDATION_ERROR cuando facultadId no es entero positivo', async () => {
      // Enviamos un id invalido para validar el manejo estandar de errores de validacion.
      await expect(
        controller.getDetailDashboard('abc' as any, {}),
      ).rejects.toMatchObject({
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
      });
    });
  });
});

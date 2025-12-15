// En este archivo escribimos las pruebas del DashboardCampusController y explicamos cada linea
// para que una persona sin conocimientos de programacion pueda seguir la logica paso a paso.

// Importamos utilidades de Nest para crear un modulo de prueba con el controlador que queremos probar.
import { Test, TestingModule } from '@nestjs/testing';
// Importamos el controlador real que vamos a validar.
import { DashboardCampusController } from './dashboard-campus.controller';
// Importamos los casos de uso que el controlador debe invocar; aqui los simularemos con mocks.
import { GetCampusDashboardGlobalUseCase } from '../application/get-campus-dashboard-global.usecase';
import { GetCampusDashboardDetailUseCase } from '../application/get-campus-dashboard-detail.usecase';

// Definimos un tipo para describir el mock del caso de uso global: solo tiene un metodo execute espiado por Jest.
type GlobalUseCaseMock = { execute: jest.Mock };
// Definimos un tipo similar para el caso de uso de detalle.
type DetailUseCaseMock = { execute: jest.Mock };

describe('DashboardCampusController', () => {
  // Guardaremos la instancia real del controlador creada por el modulo de pruebas.
  let controller: DashboardCampusController;
  // Guardaremos el mock del caso de uso global para inspeccionar como lo llama el controlador.
  let globalUseCase: GlobalUseCaseMock;
  // Guardaremos el mock del caso de uso de detalle.
  let detailUseCase: DetailUseCaseMock;

  beforeEach(async () => {
    // Creamos un mock vacio para el caso de uso global; jest.fn permite rastrear llamadas y configurar respuestas.
    globalUseCase = { execute: jest.fn() };
    // Creamos el mock para el caso de uso de detalle.
    detailUseCase = { execute: jest.fn() };

    // Construimos un modulo de prueba de Nest que registra el controlador y suministra los mocks como dependencias.
    const module: TestingModule = await Test.createTestingModule({
      // Registramos el controlador que queremos probar.
      controllers: [DashboardCampusController],
      // Registramos los proveedores, reemplazando los casos de uso reales por nuestros mocks.
      providers: [
        { provide: GetCampusDashboardGlobalUseCase, useValue: globalUseCase },
        { provide: GetCampusDashboardDetailUseCase, useValue: detailUseCase },
      ],
    }).compile(); // Compilamos el modulo para que Nest resuelva las dependencias.

    // Obtenemos la instancia del controlador ya ensamblada con los mocks.
    controller = module.get(DashboardCampusController);
  });

  describe('getGlobalDashboard', () => {
    it('convierte campusIds CSV a arreglo de enteros y delega con includeInactive booleano', async () => {
      // Preparamos el objeto que el caso de uso deberia retornar; simula el payload estable del endpoint.
      const mockResult = {
        schemaVersion: 1,
        filtersApplied: { campusIds: [1, 2], includeInactive: false },
        layout: { mode: 'global' as const },
        data: { kpis: {}, charts: {}, table: { rows: [] as any[] } },
      };
      // Configuramos el mock para que al ejecutar retorne la respuesta simulada.
      globalUseCase.execute.mockResolvedValue(mockResult);

      // Ejecutamos el metodo del controlador con los query params en formato de string (como llegan por HTTP).
      const response = await controller.getGlobalDashboard({
        campusIds: '1,2',
        includeInactive: 'false',
      });

      // Verificamos que el caso de uso fue llamado con los tipos ya parseados (numeros y booleanos).
      expect(globalUseCase.execute).toHaveBeenCalledWith({
        campusIds: [1, 2],
        includeInactive: false,
      });
      // Verificamos que el controlador devuelve exactamente lo que entrega el caso de uso.
      expect(response).toEqual(mockResult);
    });

    it('usa includeInactive=true por defecto cuando no viene en el query', async () => {
      // Preparamos un resultado simulado con includeInactive en true para validar el valor por defecto.
      const mockResult = {
        schemaVersion: 1,
        filtersApplied: { campusIds: undefined, includeInactive: true },
        layout: { mode: 'global' as const },
        data: { kpis: {}, charts: {}, table: { rows: [] as any[] } },
      };
      // Configuramos el mock para que devuelva ese resultado.
      globalUseCase.execute.mockResolvedValue(mockResult);

      // Llamamos al controlador sin includeInactive en el query.
      const response = await controller.getGlobalDashboard({});

      // Esperamos que el caso de uso reciba includeInactive en true (valor por defecto) y campusIds sin definir.
      expect(globalUseCase.execute).toHaveBeenCalledWith({
        campusIds: undefined,
        includeInactive: true,
      });
      // Confirmamos que el cuerpo de respuesta coincide con el mock.
      expect(response).toEqual(mockResult);
    });

    it('responde VALIDATION_ERROR cuando campusIds trae valores no numericos', async () => {
      // Intentamos ejecutar el controlador con un CSV invalido (letras en lugar de numeros).
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
  });

  describe('getDetailDashboard', () => {
    it('parsea campusId a entero, normaliza includeInactive y delega al caso de uso', async () => {
      // Preparamos la respuesta simulada del caso de uso de detalle.
      const mockResult = {
        schemaVersion: 1,
        filtersApplied: { campusId: 10, includeInactive: true },
        layout: { mode: 'detail' as const },
        data: { kpis: {}, charts: {}, tables: { facultades: { rows: [] } } },
      };
      // Configuramos el mock para que devuelva la respuesta.
      detailUseCase.execute.mockResolvedValue(mockResult);

      // Ejecutamos el metodo del controlador con el id en string y includeInactive en string, tal como llega en HTTP.
      const response = await controller.getDetailDashboard('10' as any, {
        includeInactive: 'true',
      });

      // Verificamos que el caso de uso recibe campusId como numero y includeInactive como boolean.
      expect(detailUseCase.execute).toHaveBeenCalledWith({
        campusId: 10,
        includeInactive: true,
      });
      // Validamos que el controlador devuelve el mismo objeto que produce el caso de uso.
      expect(response).toEqual(mockResult);
    });

    it('lanza VALIDATION_ERROR cuando campusId no es numerico', async () => {
      // Invocamos el controlador con un campusId invalido (texto) para forzar la validacion.
      await expect(
        controller.getDetailDashboard('abc' as any, {
          includeInactive: 'true',
        }),
      ).rejects.toMatchObject({
        response: {
          error: 'VALIDATION_ERROR',
          message: 'Los datos enviados no son validos',
          details: [
            {
              field: 'campusId',
              message: 'El parametro campusId debe ser un entero positivo',
            },
          ],
        },
        status: 400,
      });
    });
  });
});

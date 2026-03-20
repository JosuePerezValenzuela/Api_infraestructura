// En este archivo definimos las pruebas del controlador de dashboard por facultad.

import { Test, TestingModule } from '@nestjs/testing';
import { DashboardFacultadController } from './dashboard-facultad.controller';
import { GetFacultadDashboardGlobalUseCase } from '../application/get-facultad-dashboard-global.usecase';
import { GetFacultadDashboardDetailUseCase } from '../application/get-facultad-dashboard-detail.usecase';

type GlobalUseCaseMock = { execute: jest.Mock };
type DetailUseCaseMock = { execute: jest.Mock };

describe('DashboardFacultadController', () => {
  let controller: DashboardFacultadController;
  let globalUseCase: GlobalUseCaseMock;
  let detailUseCase: DetailUseCaseMock;

  beforeEach(async () => {
    globalUseCase = { execute: jest.fn() };
    detailUseCase = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardFacultadController],
      providers: [
        { provide: GetFacultadDashboardGlobalUseCase, useValue: globalUseCase },
        { provide: GetFacultadDashboardDetailUseCase, useValue: detailUseCase },
      ],
    }).compile();

    controller = module.get(DashboardFacultadController);
  });

  describe('getGlobalDashboard', () => {
    it('parsea campusIds y facultadIds en CSV, usa defaults y delega al caso de uso global', async () => {
      const mockResult = {
        schemaVersion: 2,
        filtersApplied: {
          campusIds: [1, 2],
          facultadIds: [10, 11],
          includeInactive: true,
        },
        layout: { mode: 'global' as const },
        data: { kpis: {}, charts: {}, tables: {} },
      };
      globalUseCase.execute.mockResolvedValue(mockResult);

      const response = await controller.getGlobalDashboard({
        campusIds: '1,2',
        facultadIds: '10,11',
      });

      expect(globalUseCase.execute).toHaveBeenCalledWith({
        campusIds: [1, 2],
        facultadIds: [10, 11],
        includeInactive: true,
      });
      expect(response).toEqual(mockResult);
    });

    it('convierte includeInactive=false cuando viene en el query', async () => {
      const mockResult = {
        schemaVersion: 2,
        filtersApplied: {
          campusIds: undefined,
          facultadIds: undefined,
          includeInactive: false,
        },
        layout: { mode: 'global' as const },
        data: { kpis: {}, charts: {}, tables: {} },
      };
      globalUseCase.execute.mockResolvedValue(mockResult);

      await controller.getGlobalDashboard({
        includeInactive: 'false',
      });

      expect(globalUseCase.execute).toHaveBeenCalledWith({
        campusIds: undefined,
        facultadIds: undefined,
        includeInactive: false,
      });
    });

    it('lanza VALIDATION_ERROR cuando campusIds no es CSV de enteros positivos', async () => {
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
    it('parsea facultadId y query params, aplica defaults y delega al caso de uso detalle', async () => {
      const mockResult = {
        schemaVersion: 2,
        filtersApplied: {
          facultadId: 22,
          includeInactive: true,
        },
        layout: { mode: 'detail' as const },
        data: { facultad: {}, kpis: {}, charts: {}, tables: {} },
      };
      detailUseCase.execute.mockResolvedValue(mockResult);

      const response = await controller.getDetailDashboard('22' as any, {});

      expect(detailUseCase.execute).toHaveBeenCalledWith({
        facultadId: 22,
        includeInactive: true,
      });
      expect(response).toEqual(mockResult);
    });

    it('lanza VALIDATION_ERROR cuando facultadId no es entero positivo', async () => {
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

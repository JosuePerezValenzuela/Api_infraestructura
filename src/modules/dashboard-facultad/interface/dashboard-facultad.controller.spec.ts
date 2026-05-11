// Pruebas del controlador de dashboard por facultad

import { Test, TestingModule } from '@nestjs/testing';
import { DashboardFacultadController } from './dashboard-facultad.controller';
import { GetFacultadDashboardDetailUseCase } from '../application/get-facultad-dashboard-detail.usecase';

type DetailUseCaseMock = { execute: jest.Mock };

describe('DashboardFacultadController', () => {
  let controller: DashboardFacultadController;
  let detailUseCase: DetailUseCaseMock;

  beforeEach(async () => {
    detailUseCase = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardFacultadController],
      providers: [
        { provide: GetFacultadDashboardDetailUseCase, useValue: detailUseCase },
      ],
    }).compile();

    controller = module.get(DashboardFacultadController);
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
        data: { facultad: {}, kpis: {}, charts: {}, porBloque: [] },
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
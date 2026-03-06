import { Test, TestingModule } from '@nestjs/testing';
import { DashboardBloqueController } from './dashboard-bloque.controller';
import { GetBloqueDashboardGlobalUseCase } from '../application/get-bloque-dashboard-global.usecase';

type GlobalUseCaseMock = { execute: jest.Mock };

describe('DashboardBloqueController', () => {
  let controller: DashboardBloqueController;
  let globalUseCase: GlobalUseCaseMock;

  beforeEach(async () => {
    globalUseCase = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardBloqueController],
      providers: [
        { provide: GetBloqueDashboardGlobalUseCase, useValue: globalUseCase },
      ],
    }).compile();

    controller = module.get(DashboardBloqueController);
  });

  it('parsea query CSV, aplica defaults y delega al caso de uso global', async () => {
    const mockResult = {
      schemaVersion: 2,
      filtersApplied: {
        campusIds: [1],
        facultadIds: [10],
        bloqueIds: [100, 101],
        tipoBloqueIds: [2],
        includeInactive: true,
        slotMinutes: 45,
        dias: [0, 1, 2, 3, 4, 5, 6],
      },
      layout: { mode: 'global' as const },
      data: { kpis: {}, charts: {}, tables: {} },
    };

    globalUseCase.execute.mockResolvedValue(mockResult);

    const response = await controller.getGlobalDashboard({
      campusIds: '1',
      facultadIds: '10',
      bloqueIds: '100,101',
      tipoBloqueIds: '2',
    });

    expect(globalUseCase.execute).toHaveBeenCalledWith({
      campusIds: [1],
      facultadIds: [10],
      bloqueIds: [100, 101],
      tipoBloqueIds: [2],
      includeInactive: true,
      slotMinutes: 45,
      dias: [0, 1, 2, 3, 4, 5, 6],
    });
    expect(response).toEqual(mockResult);
  });

  it('lanza VALIDATION_ERROR cuando slotMinutes no es permitido', async () => {
    await expect(
      controller.getGlobalDashboard({ slotMinutes: '50' }),
    ).rejects.toMatchObject({
      response: {
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
      },
      status: 400,
    });
  });
});

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
    });
    expect(response).toEqual(mockResult);
  });
});

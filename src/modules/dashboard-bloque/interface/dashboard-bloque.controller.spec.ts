import { Test, TestingModule } from '@nestjs/testing';
import { DashboardBloqueController } from './dashboard-bloque.controller';
import { GetBloqueDashboardDetailUseCase } from '../application/get-bloque-dashboard-detail.usecase';

type DetailUseCaseMock = { execute: jest.Mock };

describe('DashboardBloqueController', () => {
  let controller: DashboardBloqueController;
  let detailUseCase: DetailUseCaseMock;

  beforeEach(async () => {
    detailUseCase = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardBloqueController],
      providers: [
        { provide: GetBloqueDashboardDetailUseCase, useValue: detailUseCase },
      ],
    }).compile();

    controller = module.get(DashboardBloqueController);
  });

  it('parsea params y query, y delega al caso de uso detail', async () => {
    const mockResult = {
      schemaVersion: 2,
      filtersApplied: {
        bloqueId: 101,
        includeInactive: true,
      },
      layout: { mode: 'detail' as const },
      data: {
        bloque: {
          id: 101,
          nombre: 'Bloque A',
          nombreCorto: 'Bloque A',
          activo: true,
          pisos: 4,
          tipoBloqueId: 1,
          tipoBloqueNombre: 'Académico',
          facultadId: 22,
          facultadNombre: 'Facultad de Ingeniería',
          campusId: 1,
          campusNombre: 'Campus Central',
        },
        kpis: {
          ambientes: { total: 12, activos: 10, inactivos: 2 },
          capacidad: { total: 540, examen: 300 },
          activos: { asignados: 68, sinAsignarGlobal: 11 },
        },
        charts: { tiposAmbiente: [] },
        porAmbiente: [],
      },
    };

    detailUseCase.execute.mockResolvedValue(mockResult);

    const response = await controller.getDetailDashboard('101', {
      includeInactive: true,
    });

    expect(detailUseCase.execute).toHaveBeenCalledWith({
      bloqueId: 101,
      includeInactive: true,
    });
    expect(response).toEqual(mockResult);
  });
});
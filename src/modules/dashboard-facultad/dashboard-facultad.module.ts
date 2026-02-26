import { Module } from '@nestjs/common';
import { GetFacultadDashboardDetailUseCase } from './application/get-facultad-dashboard-detail.usecase';
import { GetFacultadDashboardGlobalUseCase } from './application/get-facultad-dashboard-global.usecase';
import { DashboardFacultadRepositoryPort } from './domain/dashboard-facultad.repository.port';
import { DashboardFacultadTypeormRepository } from './infrastructure/dashboard-facultad.typeorm.repository';
import { DashboardFacultadController } from './interface/dashboard-facultad.controller';

@Module({
  controllers: [DashboardFacultadController],
  providers: [
    GetFacultadDashboardGlobalUseCase,
    GetFacultadDashboardDetailUseCase,
    {
      provide: DashboardFacultadRepositoryPort,
      useClass: DashboardFacultadTypeormRepository,
    },
  ],
})
export class DashboardFacultadModule {}

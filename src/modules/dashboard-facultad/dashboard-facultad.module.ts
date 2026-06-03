import { Module } from '@nestjs/common';
import { GetFacultadDashboardDetailUseCase } from './application/get-facultad-dashboard-detail.usecase';
import { DashboardFacultadRepositoryPort } from './domain/dashboard-facultad.repository.port';
import { DashboardFacultadTypeormRepository } from './infrastructure/dashboard-facultad.typeorm.repository';
import { DashboardFacultadController } from './interface/dashboard-facultad.controller';

@Module({
  controllers: [DashboardFacultadController],
  providers: [
    GetFacultadDashboardDetailUseCase,
    {
      provide: DashboardFacultadRepositoryPort,
      useClass: DashboardFacultadTypeormRepository,
    },
  ],
})
export class DashboardFacultadModule {}

import { Module } from '@nestjs/common';
import { DashboardCampusController } from './interface/dashboard-campus.controller';
import { GetCampusDashboardGlobalUseCase } from './application/get-campus-dashboard-global.usecase';
import { GetCampusDashboardDetailUseCase } from './application/get-campus-dashboard-detail.usecase';
import { DashboardCacheService } from './application/dashboard-cache.service';
import { DashboardCampusRepositoryPort } from './domain/dashboard-campus.repository.port';
import { DashboardCampusTypeormRepository } from './infrastructure/dashboard-campus.typeorm.repository';

@Module({
  controllers: [DashboardCampusController],
  providers: [
    GetCampusDashboardGlobalUseCase,
    GetCampusDashboardDetailUseCase,
    DashboardCacheService,
    {
      provide: DashboardCampusRepositoryPort,
      useClass: DashboardCampusTypeormRepository,
    },
  ],
})
export class DashboardCampusModule {}

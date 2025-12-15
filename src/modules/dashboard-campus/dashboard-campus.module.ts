import { Module } from '@nestjs/common';
import { DashboardCampusController } from './interface/dashboard-campus.controller';
import { GetCampusDashboardGlobalUseCase } from './application/get-campus-dashboard-global.usecase';
import { GetCampusDashboardDetailUseCase } from './application/get-campus-dashboard-detail.usecase';

@Module({
  controllers: [DashboardCampusController],
  providers: [GetCampusDashboardGlobalUseCase, GetCampusDashboardDetailUseCase],
})
export class DashboardCampusModule {}

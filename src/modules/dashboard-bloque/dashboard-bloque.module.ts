import { Module } from '@nestjs/common';
import { GetBloqueDashboardDetailUseCase } from './application/get-bloque-dashboard-detail.usecase';
import { DashboardBloqueRepositoryPort } from './domain/dashboard-bloque.repository.port';
import { DashboardBloqueTypeormRepository } from './infrastructure/dashboard-bloque.typeorm.repository';
import { DashboardBloqueController } from './interface/dashboard-bloque.controller';

@Module({
  controllers: [DashboardBloqueController],
  providers: [
    GetBloqueDashboardDetailUseCase,
    {
      provide: DashboardBloqueRepositoryPort,
      useClass: DashboardBloqueTypeormRepository,
    },
  ],
})
export class DashboardBloqueModule {}
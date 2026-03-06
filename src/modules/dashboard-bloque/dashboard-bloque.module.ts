import { Module } from '@nestjs/common';
import { GetBloqueDashboardGlobalUseCase } from './application/get-bloque-dashboard-global.usecase';
import { DashboardBloqueRepositoryPort } from './domain/dashboard-bloque.repository.port';
import { DashboardBloqueTypeormRepository } from './infrastructure/dashboard-bloque.typeorm.repository';
import { DashboardBloqueController } from './interface/dashboard-bloque.controller';

@Module({
  controllers: [DashboardBloqueController],
  providers: [
    GetBloqueDashboardGlobalUseCase,
    {
      provide: DashboardBloqueRepositoryPort,
      useClass: DashboardBloqueTypeormRepository,
    },
  ],
})
export class DashboardBloqueModule {}

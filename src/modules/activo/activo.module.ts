import { Module } from '@nestjs/common';
import { ActivoController } from './interface/activo.controller';
import { ListActivosUseCase } from './application/list-activos.usecase';
import { ActivoRepositoryPort } from './domain/activo.repository.port';
import { TypeormActivoRepository } from './infrastructure/persistence/typeorm-activo.repository';

@Module({
  controllers: [ActivoController],
  providers: [
    ListActivosUseCase,
    {
      provide: ActivoRepositoryPort,
      useClass: TypeormActivoRepository,
    },
  ],
  exports: [ActivoRepositoryPort, ListActivosUseCase],
})
export class ActivoModule {}

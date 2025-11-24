import { Module } from '@nestjs/common';
import { ActivoController } from './interface/activo.controller';
import { ListActivosUseCase } from './application/list-activos.usecase';
import { CreateActivoUseCase } from './application/create-activo.usecase';
import { DeleteActivoUseCase } from './application/delete-activo.usecase';
import { ActivoRepositoryPort } from './domain/activo.repository.port';
import { TypeormActivoRepository } from './infrastructure/persistence/typeorm-activo.repository';

@Module({
  controllers: [ActivoController],
  providers: [
    ListActivosUseCase,
    CreateActivoUseCase,
    DeleteActivoUseCase,
    {
      provide: ActivoRepositoryPort,
      useClass: TypeormActivoRepository,
    },
  ],
  exports: [
    ActivoRepositoryPort,
    ListActivosUseCase,
    CreateActivoUseCase,
    DeleteActivoUseCase,
  ],
})
export class ActivoModule {}

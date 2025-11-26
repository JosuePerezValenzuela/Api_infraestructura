import { Module } from '@nestjs/common';
import { ActivoController } from './interface/activo.controller';
import { ListActivosUseCase } from './application/list-activos.usecase';
import { CreateActivoUseCase } from './application/create-activo.usecase';
import { DeleteActivoUseCase } from './application/delete-activo.usecase';
import { UpdateActivoUseCase } from './application/update-activo.usecase';
import { AssignActivosToAmbienteUseCase } from './application/assign-activos-to-ambiente.usecase';
import { ActivoRepositoryPort } from './domain/activo.repository.port';
import { TypeormActivoRepository } from './infrastructure/persistence/typeorm-activo.repository';
import { AmbienteModule } from '../ambiente/ambiente.module';
import { UpsertActivoByNiaUseCase } from './application/upsert-activo-by-nia.usecase';

@Module({
  imports: [AmbienteModule],
  controllers: [ActivoController],
  providers: [
    ListActivosUseCase,
    CreateActivoUseCase,
    DeleteActivoUseCase,
    UpdateActivoUseCase,
    AssignActivosToAmbienteUseCase,
    UpsertActivoByNiaUseCase,
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
    UpdateActivoUseCase,
    AssignActivosToAmbienteUseCase,
    UpsertActivoByNiaUseCase,
  ],
})
export class ActivoModule {}

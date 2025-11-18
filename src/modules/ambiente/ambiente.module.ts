import { Module } from '@nestjs/common';
import { AmbienteController } from './interface/ambiente.controller';
import { CreateAmbienteUseCase } from './application/create-ambiente.usecase';
import { ListAmbientesUseCase } from './application/list-ambientes.usecase';
import { DeleteAmbienteUseCase } from './application/delete-ambiente.usecase';
import { UpdateAmbienteUseCase } from './application/update-ambiente.usecase';
import { AmbienteRepositoryPort } from './domain/ambiente.repository.port';
import { TypeormAmbienteRepository } from './infrastructure/persistence/typeorm-ambiente.repository';
import { BloqueModule } from '../bloque/bloque.module';
import { TipoAmbienteModule } from '../tipo-ambiente/tipo-ambiente.module';

@Module({
  imports: [BloqueModule, TipoAmbienteModule],
  controllers: [AmbienteController],
  providers: [
    CreateAmbienteUseCase,
    ListAmbientesUseCase,
    DeleteAmbienteUseCase,
    UpdateAmbienteUseCase,
    {
      provide: AmbienteRepositoryPort,
      useClass: TypeormAmbienteRepository,
    },
  ],
  exports: [
    AmbienteRepositoryPort,
    CreateAmbienteUseCase,
    ListAmbientesUseCase,
    DeleteAmbienteUseCase,
    UpdateAmbienteUseCase,
  ],
})
export class AmbienteModule {}

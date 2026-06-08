import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateTipoAmbienteUseCase } from './application/create-tipo-ambiente.usecase';
import { TipoAmbienteController } from './interface/tipo-ambiente.controller';
import { TipoAmbienteRepositoryPort } from './domain/tipo-ambiente.repository.port';
import { TypeormTipoAmbienteRepository } from './infrastructure/persistence/typeorm-tipo-ambiente.repository';
import { ListTipoAmbientesUseCase } from './application/list-tipo-ambientes.usecase';
import { DeleteTipoAmbienteUseCase } from './application/delete-tipo-ambiente.usecase';
import { UpdateTipoAmbienteUseCase } from './application/update-tipo-ambiente.usecase';
import { CacheService } from '../_shared/infrastructure/cache/cache.service';

@Module({
  imports: [TypeOrmModule.forFeature([])],
  controllers: [TipoAmbienteController],
  providers: [
    CreateTipoAmbienteUseCase,
    ListTipoAmbientesUseCase,
    DeleteTipoAmbienteUseCase,
    UpdateTipoAmbienteUseCase,
    CacheService,
    {
      provide: TipoAmbienteRepositoryPort,
      useClass: TypeormTipoAmbienteRepository,
    },
  ],
  exports: [TipoAmbienteRepositoryPort, ListTipoAmbientesUseCase],
})
export class TipoAmbienteModule {}

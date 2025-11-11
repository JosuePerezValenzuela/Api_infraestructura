import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateTipoAmbienteUseCase } from './application/create-tipo-ambiente.usecase';
import { TipoAmbienteController } from './interface/tipo-ambiente.controller';
import { TipoAmbienteRepositoryPort } from './domain/tipo-ambiente.repository.port';
import { TypeormTipoAmbienteRepository } from './infrastructure/persistence/typeorm-tipo-ambiente.repository';
import { ListTipoAmbientesUseCase } from './application/list-tipo-ambientes.usecase';

@Module({
  imports: [TypeOrmModule.forFeature([])],
  controllers: [TipoAmbienteController],
  providers: [
    CreateTipoAmbienteUseCase,
    ListTipoAmbientesUseCase,
    {
      provide: TipoAmbienteRepositoryPort,
      useClass: TypeormTipoAmbienteRepository,
    },
  ],
})
export class TipoAmbienteModule {}

import { Module } from '@nestjs/common';
import { AmbienteController } from './interface/ambiente.controller';
import { CreateAmbienteUseCase } from './application/create-ambiente.usecase';
import { AmbienteRepositoryPort } from './domain/ambiente.repository.port';
import { TypeormAmbienteRepository } from './infrastructure/persistence/typeorm-ambiente.repository';
import { BloqueModule } from '../bloque/bloque.module';
import { TipoAmbienteModule } from '../tipo-ambiente/tipo-ambiente.module';

@Module({
  imports: [BloqueModule, TipoAmbienteModule],
  controllers: [AmbienteController],
  providers: [
    CreateAmbienteUseCase,
    {
      provide: AmbienteRepositoryPort,
      useClass: TypeormAmbienteRepository,
    },
  ],
  exports: [AmbienteRepositoryPort, CreateAmbienteUseCase],
})
export class AmbienteModule {}

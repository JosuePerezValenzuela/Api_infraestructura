import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateTipoAmbienteUseCase } from './application/create-tipo-ambiente.usecase';
import { TipoAmbienteController } from './interface/tipo-ambiente.controller';
import { TipoAmbienteRepositoryPort } from './domain/tipo-ambiente.repository.port';
import { TypeormTipoAmbienteRepository } from './infrastructure/persistence/typeorm-tipo-ambiente.repository';

@Module({
  imports: [TypeOrmModule.forFeature([])],
  controllers: [TipoAmbienteController],
  providers: [
    CreateTipoAmbienteUseCase,
    {
      provide: TipoAmbienteRepositoryPort,
      useClass: TypeormTipoAmbienteRepository,
    },
  ],
})
export class TipoAmbienteModule {}

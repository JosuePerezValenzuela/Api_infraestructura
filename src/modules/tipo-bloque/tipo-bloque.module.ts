import { Module } from '@nestjs/common';
import { TipoBloqueController } from './interface/tipo-bloque.controller';
import { CreateTipoBloqueUseCase } from './application/create-tipo-bloque.usecase';
import { TipoBloqueRepositoryPort } from './domain/tipo-bloque.repository.port';
import { TypeormTipoBloqueRepository } from './infrastructure/persistence/typeorm-tipo-bloque.repository';

@Module({
  controllers: [TipoBloqueController],
  providers: [
    CreateTipoBloqueUseCase,
    {
      provide: TipoBloqueRepositoryPort,
      useClass: TypeormTipoBloqueRepository,
    },
  ],
  exports: [CreateTipoBloqueUseCase],
})
export class TipoBloqueModule {}

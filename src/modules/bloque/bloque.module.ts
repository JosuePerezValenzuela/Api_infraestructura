import { Module } from '@nestjs/common';
import { FacultadModule } from '../facultad/facultad.module';
import { TipoBloqueModule } from '../tipo-bloque/tipo-bloque.module';

import { BloqueController } from './interface/bloque.controller';
import { CreateBloqueUseCase } from './application/create-bloque.usecase';
import { BloqueRepositoryPort } from './domain/bloque.repository.port';
import { TypeormBloqueRepository } from './infrastructure/persistence/typeorm-bloque.repository';

@Module({
  imports: [FacultadModule, TipoBloqueModule],
  controllers: [BloqueController],
  providers: [
    CreateBloqueUseCase,
    {
      provide: BloqueRepositoryPort,
      useClass: TypeormBloqueRepository,
    },
  ],
  exports: [CreateBloqueUseCase],
})
export class BloqueModule {}

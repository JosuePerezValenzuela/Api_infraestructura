import { Module } from '@nestjs/common';
import { FacultadModule } from '../facultad/facultad.module';
import { TipoBloqueModule } from '../tipo-bloque/tipo-bloque.module';
import { RelationshipsModule } from '../_shared/relationships/relationships.module';

import { BloqueController } from './interface/bloque.controller';
import { CreateBloqueUseCase } from './application/create-bloque.usecase';
import { ListBloquesUseCase } from './application/list-bloques.usecase';
import { UpdateBloqueUseCase } from './application/update-bloque.usecase';

import { BloqueRepositoryPort } from './domain/bloque.repository.port';
import { TypeormBloqueRepository } from './infrastructure/persistence/typeorm-bloque.repository';

@Module({
  imports: [FacultadModule, TipoBloqueModule, RelationshipsModule],
  controllers: [BloqueController],
  providers: [
    CreateBloqueUseCase,
    ListBloquesUseCase,
    UpdateBloqueUseCase,
    {
      provide: BloqueRepositoryPort,
      useClass: TypeormBloqueRepository,
    },
  ],
  exports: [BloqueRepositoryPort, ListBloquesUseCase, UpdateBloqueUseCase],
})
export class BloqueModule {}

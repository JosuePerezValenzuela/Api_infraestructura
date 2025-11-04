import { Module } from '@nestjs/common';
import { TipoBloqueController } from './interface/tipo-bloque.controller';
import { CreateTipoBloqueUseCase } from './application/create-tipo-bloque.usecase';
import { ListTipoBloquesUseCase } from './application/list-tipo-bloques.usecase';
import { UpdateTipoBloqueUseCase } from './application/update-tipo-bloque.usecase';
import { DeleteTipoBloqueUseCase } from './application/delete-tipo-bloque.usecase';
import { TipoBloqueRepositoryPort } from './domain/tipo-bloque.repository.port';
import { RelationshipsModule } from '../_shared/relationships/relationships.module';
import { TypeormTipoBloqueRepository } from './infrastructure/persistence/typeorm-tipo-bloque.repository';

@Module({
  imports: [RelationshipsModule],
  controllers: [TipoBloqueController],
  providers: [
    CreateTipoBloqueUseCase,
    ListTipoBloquesUseCase,
    UpdateTipoBloqueUseCase,
    DeleteTipoBloqueUseCase,
    {
      provide: TipoBloqueRepositoryPort,
      useClass: TypeormTipoBloqueRepository,
    },
  ],
  exports: [
    CreateTipoBloqueUseCase,
    ListTipoBloquesUseCase,
    UpdateTipoBloqueUseCase,
    DeleteTipoBloqueUseCase,
    TipoBloqueRepositoryPort,
  ],
})
export class TipoBloqueModule {}

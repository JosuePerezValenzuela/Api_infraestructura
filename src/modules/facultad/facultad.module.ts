import { Module } from '@nestjs/common';
import { CampusModule } from '../campus/campus.module';
import { RelationshipsModule } from '../_shared/relationships/relationships.module';

import { CreateFacultadUseCase } from './application/create-facultad.usecase';
import { ListFacultadesUseCase } from './application/list-facultades.usecase';
import { UpdateFacultadUseCase } from './application/update-facultad.usecase';

import { FacultadRepositoryPort } from './domain/facultad.repository.port';

import { TypeormFacultadRepository } from './infraestructure/persistence/facultad.typeorm.repository';

import { FacultadController } from './interface/facultad.controller';

@Module({
  imports: [CampusModule, RelationshipsModule],
  controllers: [FacultadController],
  providers: [
    CreateFacultadUseCase,
    ListFacultadesUseCase,
    UpdateFacultadUseCase,
    {
      provide: FacultadRepositoryPort,
      useClass: TypeormFacultadRepository,
    },
  ],
  exports: [
    CreateFacultadUseCase,
    ListFacultadesUseCase,
    UpdateFacultadUseCase,
  ],
})
export class FacultadModule {}

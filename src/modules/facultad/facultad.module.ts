import { Module } from '@nestjs/common';
import { CampusModule } from '../campus/campus.module';
import { CreateFacultadUseCase } from './application/create-facultad.usecase';
import { FacultadRepositoryPort } from './domain/facultad.repository.port';
import { TypeormFacultadRepository } from './infraestructure/persistence/facultad.typeorm.repository';

@Module({
  imports: [CampusModule],
  providers: [
    CreateFacultadUseCase,
    {
      provide: FacultadRepositoryPort,
      useClass: TypeormFacultadRepository,
    },
  ],
  exports: [CreateFacultadUseCase],
})
export class FacultadModule {}

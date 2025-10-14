import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeormCampusRepository } from './infrastructure/campus.typeorm.repository';
import { CampusOrmEntity } from './infrastructure/campus.orm-entity';

import { CampusRepositoryPort } from './domain/campus.repository.port';

import { CreateCampusUseCase } from './application/create-campus.usecase';
import { ListCampusUseCase } from './application/list-campus.usecase';
import { UpdateCampusUseCase } from './application/update-campus.usecase';
import { DeleteCampusUseCase } from './application/delete-campus.usecase';

import { CampusController } from './interface/campus.controller';

import { RelationshipsModule } from '../_shared/relationships/relationships.module';
@Module({
  imports: [TypeOrmModule.forFeature([CampusOrmEntity]), RelationshipsModule],
  controllers: [CampusController],
  providers: [
    CreateCampusUseCase,
    ListCampusUseCase,
    UpdateCampusUseCase,
    DeleteCampusUseCase,
    { provide: CampusRepositoryPort, useClass: TypeormCampusRepository },
  ],
  exports: [CampusRepositoryPort],
})
export class CampusModule {}

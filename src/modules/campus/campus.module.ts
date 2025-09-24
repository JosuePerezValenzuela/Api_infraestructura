import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CampusOrmEntity } from './infrastructure/campus.orm-entity';
import { CampusRepositoryPort } from './domain/campus.repository.port';
import { CreateCampusUseCase } from './application/create-campus.usecase';
import { CampusController } from './interface/campus.controller';
import { TypeormCampusRepository } from './infrastructure/campus.typeorm.repository';
import { ListCampusUseCase } from './application/list-campus.usecase';
@Module({
  imports: [TypeOrmModule.forFeature([CampusOrmEntity])],
  controllers: [CampusController],
  providers: [
    CreateCampusUseCase,
    ListCampusUseCase,
    { provide: CampusRepositoryPort, useClass: TypeormCampusRepository },
  ],
})
export class CampusModule {}

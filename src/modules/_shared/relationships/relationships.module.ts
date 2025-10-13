import { Module } from '@nestjs/common';
import { RelationshipsPort } from './domain/relationships.port';
import { TypeormRelationshipRepository } from './domain/infraestructure/persistence/relationships.typeorm.repository';

@Module({
  providers: [
    {
      provide: RelationshipsPort,
      useClass: TypeormRelationshipRepository,
    },
  ],
  exports: [RelationshipsPort],
})
export class RelationshipsModule {}

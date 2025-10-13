import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { RelationshipsPort } from '../../relationships.port';

export class TypeormRelationshipRepository implements RelationshipsPort {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async markCampusCascadeIncative(campusId: number): Promise<void> {
    throw new Error('Sin implementar');
  }

  async markFacultadCascadeInactive(facultadId: number): Promise<void> {
    throw new Error('Sin implementar');
  }

  async markBloquesCascadeInactive(bloqueId: number): Promise<void> {
    throw new Error('Sin implementar');
  }

  async markAmbientesCascadeInactive(ambientId: number): Promise<void> {
    throw new Error('Sin implementar');
  }
}

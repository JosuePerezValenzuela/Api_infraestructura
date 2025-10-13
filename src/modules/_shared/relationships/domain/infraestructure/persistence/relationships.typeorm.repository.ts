import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, QueryRunner } from 'typeorm';
import { RelationshipsPort } from '../../relationships.port';

export class TypeormRelationshipRepository implements RelationshipsPort {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  private async runInTransaction(
    work: (runner: QueryRunner) => Promise<void>,
  ): Promise<void> {
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();
    try {
      await work(runner);
      await runner.commitTransaction();
    } catch (error) {
      await runner.rollbackTransaction();
      throw error;
    } finally {
      await runner.release();
    }
  }

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

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
    await this.runInTransaction(async (runner) => {
      const facultyRows: Array<{ id: number }> = await runner.query(
        `
          UPDATE infraestructura.facultades
          SET activo = FALSE
          WHERE campus_id = $1
          RETURNING id
        `,
        [campusId],
      );

      const facutyIds = facultyRows.map((row) => Number(row.id));
      if (facutyIds.length === 0) {
        return;
      }
      await this.markFacultadesDependenciesInactive(facutyIds, runner);
    });
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

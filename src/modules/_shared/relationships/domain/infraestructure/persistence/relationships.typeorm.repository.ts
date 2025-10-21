import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, QueryRunner } from 'typeorm';
import { RelationshipsPort } from '../../relationships.port';

export class TypeormRelationshipRepository implements RelationshipsPort {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  //Ejecutador de transacciones
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

  //Actualizacion de estados en cadena
  async markCampusCascadeInactive(campusId: number): Promise<void> {
    await this.runInTransaction(async (runner) => {
      const rawFacultyRows: unknown = await runner.query(
        `
          UPDATE infraestructura.facultades
          SET activo = FALSE
          WHERE campus_id = $1
          RETURNING id
        `,
        [campusId],
      );

      const facultyRows = this.mapRowsWithId(rawFacultyRows, 'facultades');
      const facultyIds = facultyRows.map((row) => Number(row.id));
      if (facultyIds.length === 0) {
        return;
      }
      await this.markFacultadesDependenciesInactive(facultyIds, runner);
    });
  }

  async markFacultadCascadeInactive(facultadId: number): Promise<void> {
    await this.runInTransaction(async (runner) => {
      await this.markFacultadesDependenciesInactive([facultadId], runner);
    });
  }

  async markBloquesCascadeInactive(bloqueId: number): Promise<void> {
    await this.runInTransaction(async (runner) => {
      await this.markBloquesDependenciesInactive([bloqueId], runner);
    });
  }

  private async markFacultadesDependenciesInactive(
    facultadIds: number[],
    runner: QueryRunner,
  ): Promise<void> {
    const rawBlocksRows: unknown = await runner.query(
      `
        UPDATE infraestructura.bloques
        SET activo = FALSE
        WHERE facultad_id = ANY($1)
        RETURNING id
      `,
      [facultadIds],
    );

    const blockRows = this.mapRowsWithId(rawBlocksRows, 'Bloques');
    const blocksIds = blockRows.map((row) => Number(row.id));
    if (blocksIds.length === 0) {
      return;
    }

    await this.markBloquesDependenciesInactive(blocksIds, runner);
  }

  private async markBloquesDependenciesInactive(
    blocksIds: number[],
    runner: QueryRunner,
  ): Promise<void> {
    if (blocksIds.length === 0) {
      return;
    }

    await runner.query(
      `
        UPDATE infraestructura.ambientes
        SET activo = FALSE
        WHERE bloque_id = ANY($1)
      `,
      [blocksIds],
    );
  }

  //Eliminaciones en cadena

  async deleteCampusCascade(campusId: number): Promise<void> {
    await this.runInTransaction(async (runner) => {
      const rawFacultyRows: unknown = await runner.query(
        `
          SELECT id
          FROM infraestructura.facultades
          WHERE campus_id = $1
        `,
        [campusId],
      );

      const facultyRows = this.mapRowsWithId(rawFacultyRows, 'facultades');
      const facultyIds = facultyRows.map((row) => Number(row.id));
      if (facultyIds.length > 0) {
        await this.deleteFacultiesDependencies(facultyIds, runner);

        await runner.query(
          `
            DELETE FROM infraestructura.facultades
            WHERE id = ANY($1)
          `,
          [facultyIds],
        );
      }

      await runner.query(
        `
          DELETE FROM infraestructura.campus
          WHERE id = $1
        `,
        [campusId],
      );
    });
  }

  async deleteFacultadCascade(facultadId: number): Promise<void> {
    await this.runInTransaction(async (runner) => {
      await this.deleteFacultiesDependencies([facultadId], runner);
    });
  }

  private async deleteFacultiesDependencies(
    facultyIds: number[],
    runner: QueryRunner,
  ): Promise<void> {
    const rawBlocksRows: unknown = await runner.query(
      `
        SELECT id
        FROM infraestructura.bloques
        WHERE facultad_id = ANY($1)
      `,
      [facultyIds],
    );

    const blockRows = this.mapRowsWithId(rawBlocksRows, 'Bloques');
    const blocksIds = blockRows.map((row) => Number(row.id));

    if (blocksIds.length === 0) {
      return;
    }

    await this.deleteBlocksDependencies(blocksIds, runner);

    await runner.query(
      `
        DELETE FROM infraestructura.bloques
        WHERE id = ANY($1)
      `,
      [blocksIds],
    );
  }

  private async deleteBlocksDependencies(
    blocksIds: number[],
    runner: QueryRunner,
  ): Promise<void> {
    if (blocksIds.length === 0) {
      return;
    }

    await runner.query(
      `
        DELETE FROM infraestructura.ambientes
        WHERE bloque_id = ANY($1)
      `,
      [blocksIds],
    );
  }

  // HELPERS DE CONVERSIONES
  private mapRowsWithId(raw: unknown, context: string): Array<{ id: number }> {
    const rows = this.normalizeRows(raw, context);
    return rows.map((row, index) => {
      if (!row || typeof row !== 'object' || !('id' in row)) {
        throw new Error(`Fila ${index + 1} en ${context} no trae id`);
      }

      const id = Number((row as { id: unknown }).id);
      if (!Number.isFinite(id)) {
        throw new Error(`Fila ${index + 1} en ${context} tiene id invalido`);
      }

      return { id };
    });
  }

  private normalizeRows(raw: unknown, context: string): unknown[] {
    if (Array.isArray(raw)) {
      const rows = raw.find((item) => Array.isArray(item)) ?? raw;
      return rows.filter((item) => item && typeof item === 'object');
    }

    if (raw && typeof raw === 'object') {
      const candidate = raw as Record<string, unknown>;
      if (Array.isArray(candidate.rows)) {
        return candidate.rows;
      }
      if (Array.isArray(candidate[0])) {
        return (candidate[0] as unknown[]).filter(
          (item) => item && typeof item === 'object',
        );
      }
    }
    throw new Error(`Resultado inesperado de ${context}: no es un array`);
  }
}

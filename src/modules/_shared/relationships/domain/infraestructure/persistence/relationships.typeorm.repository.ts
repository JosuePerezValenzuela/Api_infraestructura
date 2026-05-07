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
      // 1. Desactivar el bloque
      await runner.query(
        `UPDATE infraestructura.bloques SET activo = false WHERE id = $1`,
        [bloqueId],
      );
      // 2. Desactivar todos sus ambientes
      await this.markBloquesDependenciesInactive([bloqueId], runner);
    });
  }

  private async markFacultadesDependenciesInactive(
    facultadIds: number[],
    runner: QueryRunner,
  ): Promise<void> {
    // 1. Obtener las relaciones campus_facultades de estas facultades
    const rawRelRows: unknown = await runner.query(
      `
        UPDATE infraestructura.campus_facultades
        SET activo = FALSE
        WHERE facultad_id = ANY($1)
        RETURNING id
      `,
      [facultadIds],
    );

    const relRows = this.mapRowsWithId(rawRelRows, 'campus_facultades');
    const relIds = relRows.map((row) => Number(row.id));

    if (relIds.length === 0) {
      return;
    }

    // 2. Inactivar bloques que dependen de estas relaciones
    const rawBlocksRows: unknown = await runner.query(
      `
        UPDATE infraestructura.bloques
        SET activo = FALSE
        WHERE campus_facultad_id = ANY($1)
        RETURNING id
      `,
      [relIds],
    );

    const blockRows = this.mapRowsWithId(rawBlocksRows, 'Bloques');
    const blocksIds = blockRows.map((row) => Number(row.id));

    if (blocksIds.length > 0) {
      // 3. Inactivar ambientes de esos bloques (pero NO activos)
      await this.markBloquesDependenciesInactive(blocksIds, runner);
    }
  }

  private async markBloquesDependenciesInactive(
    blocksIds: number[],
    runner: QueryRunner,
  ): Promise<void> {
    if (blocksIds.length === 0) {
      return;
    }

    // Inactivar TODOS los ambientes de los bloques (sin importar si tienen activos)
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
      // 1. Obtener las relaciones campus_facultades de este campus
      const rawRelRows: unknown = await runner.query(
        `
          UPDATE infraestructura.campus_facultades
          SET activo = FALSE
          WHERE campus_id = $1
          RETURNING id, facultad_id
        `,
        [campusId],
      );

      // Normalizar y extraer todos los campos necesarios
      const normalizedRows = this.normalizeRows(
        rawRelRows,
        'campus_facultades',
      );
      const relIds: number[] = [];
      const facultyIdsSet = new Set<number>();

      for (const row of normalizedRows) {
        const r = row as { id?: unknown; facultad_id?: unknown };
        if ('id' in r && typeof r.id === 'number') {
          relIds.push(r.id);
        }
        if ('facultad_id' in r && typeof r.facultad_id === 'number') {
          facultyIdsSet.add(r.facultad_id);
        }
      }
      const facultyIds = Array.from(facultyIdsSet);

      // 2. Inactivar bloques y ambientes de esas relaciones
      if (relIds.length > 0) {
        // Inactivar bloques
        await runner.query(
          `
            UPDATE infraestructura.bloques
            SET activo = FALSE
            WHERE campus_facultad_id = ANY($1)
          `,
          [relIds],
        );

        // Obtener IDs de bloques para inactivar ambientes
        const rawBlocksRows: unknown = await runner.query(
          `
            SELECT id FROM infraestructura.bloques
            WHERE campus_facultad_id = ANY($1)
          `,
          [relIds],
        );
        const blockRows = this.mapRowsWithId(rawBlocksRows, 'Bloques');
        const blocksIds = blockRows.map((row) => Number(row.id));

        // Usar función compartida para inactivar ambientes
        await this.markBloquesDependenciesInactive(blocksIds, runner);
      }

      // 3. Inactivar las facultades
      if (facultyIds.length > 0) {
        await runner.query(
          `
            UPDATE infraestructura.facultades
            SET activo = FALSE
            WHERE id = ANY($1)
          `,
          [facultyIds],
        );
      }

      // 4. Soft delete del campus
      await runner.query(
        `
          UPDATE infraestructura.campus
          SET activo = FALSE
          WHERE id = $1
        `,
        [campusId],
      );
    });
  }

  async deleteFacultadCascade(facultadId: number): Promise<void> {
    await this.runInTransaction(async (runner) => {
      // 1. Soft delete de relaciones, bloques y ambientes
      await this.markFacultadesDependenciesInactive([facultadId], runner);
      // 2. Soft delete de la facultad
      await runner.query(
        `
          UPDATE infraestructura.facultades
          SET activo = FALSE
          WHERE id = $1
        `,
        [facultadId],
      );
    });
  }

  async deleteTipoBloqueCascade(tipoBloqueId: number): Promise<void> {
    await this.runInTransaction(async (runner) => {
      // Busqueda de los bloques que usan este tipo de bloque
      const rawBlocksRows: unknown = await runner.query(
        `
          SELECT id
          FROM infraestructura.bloques
          WHERE tipo_bloque_id = $1
        `,
        [tipoBloqueId],
      );

      //Converitmos el resutado en una lista de ids validadndo que cada fila traiga un identificador numerico
      const blockRows = this.mapRowsWithId(rawBlocksRows, 'Bloques');
      const blocksIds = blockRows.map((row) => Number(row.id));

      // Si existen bloques relaciones, eliminamos primero sus ambientes y luego los bloques
      if (blocksIds.length > 0) {
        await this.deleteBlocksDependencies(blocksIds, runner);

        await runner.query(
          `
            DELETE FROM infraestructura.bloques
            WHERE id = ANY($1)
          `,
          [blocksIds],
        );
      }

      // Eliminamos el tipo de bloque en si
      await runner.query(
        `
          DELETE FROM infraestructura.tipo_bloques
          WHERE id = $1
        `,
        [tipoBloqueId],
      );
    });
  }

  async deleteBloqueCascade(bloqueId: number): Promise<void> {
    await this.runInTransaction(async (runner) => {
      // Busqueda de los ambientes que usan este bloque
      const rawAmbientesRows: unknown = await runner.query(
        `
          SELECT id
          FROM infraestructura.ambientes
          WHERE bloque_id = $1
        `,
        [bloqueId],
      );

      //Converitmos el resutado en una lista de ids validadndo que cada fila traiga un identificador numerico
      const ambientesRows = this.mapRowsWithId(rawAmbientesRows, 'Ambientes');
      const ambientesIds = ambientesRows.map((row) => Number(row.id));

      // Si existen bloques relaciones, eliminamos primero sus ambientes y luego los bloques
      if (ambientesIds.length > 0) {
        await this.deleteBlocksDependencies([bloqueId], runner);
      }

      await runner.query(
        `
          DELETE FROM infraestructura.bloques
          WHERE id = $1
        `,
        [bloqueId],
      );
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

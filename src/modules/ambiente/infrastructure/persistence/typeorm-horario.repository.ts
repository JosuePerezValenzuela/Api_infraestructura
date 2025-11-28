import { ConflictException, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, QueryFailedError, QueryRunner } from 'typeorm';
import {
  HorarioRepositoryPort,
  ReplaceHorariosCommand,
  ReplaceHorariosResult,
  HorarioSlot,
} from '../../domain/horario.repository.port';

@Injectable()
export class TypeormHorarioRepository implements HorarioRepositoryPort {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async replaceForAmbiente(
    command: ReplaceHorariosCommand,
  ): Promise<ReplaceHorariosResult> {
    return this.runInTransaction(async (runner) => {
      // Eliminamos todas las franjas previas del ambiente.
      await runner.query(
        `
          DELETE FROM infraestructura.horarios
          WHERE ambiente_id = $1
        `,
        [command.ambiente_id],
      );

      if (command.franjas.length === 0) {
        return { ambiente_id: command.ambiente_id, total: 0 };
      }

      const insertSql = this.buildInsertSql(command.franjas.length);
      const params = this.buildInsertParams(command);

      try {
        await runner.query(insertSql, params);
      } catch (error) {
        this.handleConflict(error);
        throw error;
      }

      return {
        ambiente_id: command.ambiente_id,
        total: command.franjas.length,
      };
    });
  }

  async listByAmbiente(ambiente_id: number): Promise<HorarioSlot[]> {
    const sql = `
      SELECT dia, hora_inicio, hora_fin
      FROM infraestructura.horarios
      WHERE ambiente_id = $1
      ORDER BY dia ASC, hora_inicio ASC
    `;
    const rows = await this.dataSource.query<HorarioSlot[]>(sql, [ambiente_id]);
    return rows.map((row) => ({
      dia: Number(row.dia) as HorarioSlot['dia'],
      hora_inicio: row.hora_inicio,
      hora_fin: row.hora_fin,
    }));
  }

  // Helpers
  private async runInTransaction<T>(
    work: (runner: QueryRunner) => Promise<T>,
  ): Promise<T> {
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();
    try {
      const result = await work(runner);
      await runner.commitTransaction();
      return result;
    } catch (error) {
      await runner.rollbackTransaction();
      throw error;
    } finally {
      await runner.release();
    }
  }

  private buildInsertSql(total: number): string {
    const values = Array.from({ length: total })
      .map((_, index) => {
        const base = index * 4;
        return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`;
      })
      .join(', ');

    return `
      INSERT INTO infraestructura.horarios (ambiente_id, dia, hora_inicio, hora_fin)
      VALUES ${values}
    `;
  }

  private buildInsertParams(
    command: ReplaceHorariosCommand,
  ): Array<string | number> {
    const params: Array<string | number> = [];
    for (const slot of command.franjas) {
      params.push(
        command.ambiente_id,
        slot.dia,
        slot.hora_inicio,
        slot.hora_fin,
      );
    }
    return params;
  }

  private handleConflict(error: unknown): void {
    if (error instanceof QueryFailedError) {
      const driverError = error.driverError as { code?: string } | undefined;
      if (driverError?.code === '23P01' || driverError?.code === '23505') {
        // 23P01: exclusion constraint violation (solapamiento)
        // 23505: unique violation (por si se define constraint adicional)
        throw new ConflictException({
          error: 'CONFLICT_ERROR',
          message: 'Los datos enviados no son validos',
          details: [
            {
              field: 'franjas',
              message:
                'Las franjas se traslapan o violan una restriccion unica',
            },
          ],
        });
      }
    }
  }
}

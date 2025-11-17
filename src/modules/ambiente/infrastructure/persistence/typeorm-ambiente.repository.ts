import { ConflictException, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, QueryFailedError } from 'typeorm';
import {
  AmbienteRepositoryPort,
  CreateAmbienteResult,
} from '../../domain/ambiente.repository.port';
import { CreateAmbienteCommand } from '../../domain/commands/create-ambiente.command';

@Injectable()
export class TypeormAmbienteRepository implements AmbienteRepositoryPort {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async create(command: CreateAmbienteCommand): Promise<CreateAmbienteResult> {
    const sql = `
      INSERT INTO infraestructura.ambientes (
        nombre,
        nombre_corto,
        codigo,
        piso,
        capacidad,
        dimension,
        clases,
        activo,
        tipo_ambiente_id,
        bloque_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `;

    const params = [
      command.nombre,
      command.nombre_corto,
      command.codigo,
      command.piso,
      command.capacidad,
      command.dimension,
      command.clases,
      command.activo,
      command.tipo_ambiente_id,
      command.bloque_id,
    ];

    try {
      const rows: [{ id: number }] = await this.dataSource.query(sql, params);
      const [row] = rows;
      return { id: Number(row.id) };
    } catch (error) {
      this.handleUniqueCodeError(error);
      throw error;
    }
  }

  async isCodeTaken(codigo: string): Promise<boolean> {
    const sql = `
      SELECT 1 AS existe
      FROM infraestructura.ambientes
      WHERE codigo = $1
      LIMIT 1
    `;
    const rows = await this.dataSource.query<{ existe: number }[]>(sql, [
      codigo,
    ]);
    return rows.length > 0;
  }

  private handleUniqueCodeError(error: unknown): void {
    if (error instanceof QueryFailedError) {
      const driverError = error.driverError as { code?: string } | undefined;
      if (driverError?.code === '23505') {
        throw new ConflictException({
          error: 'CONFLICT_ERROR',
          message: 'Los datos enviados no son validos',
          details: [
            {
              field: 'codigo',
              message: 'Ya existe un ambiente con ese codigo',
            },
          ],
        });
      }
    }
  }
}

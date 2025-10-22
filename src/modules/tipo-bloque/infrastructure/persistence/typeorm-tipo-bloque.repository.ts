import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, QueryFailedError } from 'typeorm';
import { ConflictException, Injectable } from '@nestjs/common';
import { CreateTipoBloqueCommand } from '../../domain/commands/create-tipo-bloque.command';
import { TipoBloqueRepositoryPort } from '../../domain/tipo-bloque.repository.port';

@Injectable()
export class TypeormTipoBloqueRepository implements TipoBloqueRepositoryPort {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async create(command: CreateTipoBloqueCommand): Promise<{ id: number }> {
    try {
      const sql = `
        INSERT INTO infraestructura.tipo_bloques (nombre, descripcion, activo)
        VALUES ($1, $2, $3)
        RETURNING id
      `;

      const params = [command.nombre, command.descripcion, command.activo];

      const rows: Array<{ id: number | string }> = await this.dataSource.query(
        sql,
        params,
      );

      const [row] = rows;

      if (!row) {
        throw new Error('No se puedo obtener el identificador generado');
      }

      return { id: Number(row.id) };
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const driverError = error.driverError as { code?: string } | undefined;
        if (driverError?.code === '23505') {
          throw new ConflictException({
            error: 'CONFLICT_ERROR',
            message: 'Los datos enviados no son validos',
            details: ['name', 'El nombre debe ser unico'],
          });
        }
      }
      throw error;
    }
  }

  async isNameTaken(nombre: string): Promise<boolean> {
    const sql = `
      SELECT 1 AS existe
      FROM infraestructura.tipo_bloques
      WHERE nombre = $1
    `;

    const rows: Array<{ existe: number }> = await this.dataSource.query(sql, [
      nombre,
    ]);

    return rows.length > 0;
  }
}

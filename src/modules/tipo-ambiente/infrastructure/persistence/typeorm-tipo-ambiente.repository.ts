import { Injectable, ConflictException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, QueryFailedError } from 'typeorm';
import { TipoAmbienteRepositoryPort } from '../../domain/tipo-ambiente.repository.port';
import { CreateTipoAmbienteCommand } from '../../domain/commands/create-tipo-ambiente.command';

@Injectable()
export class TypeormTipoAmbienteRepository
  implements TipoAmbienteRepositoryPort
{
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async create(command: CreateTipoAmbienteCommand): Promise<{ id: number }> {
    const sql = `
      INSERT INTO infraestructura.tipo_ambientes
        (nombre, descripcion, descripcion_corta, activo)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `;

    const params = [
      command.nombre,
      command.descripcion,
      command.descripcion_corta ?? null,
      command.activo,
    ];

    try {
      const rows: Array<{ id: number | string }> = await this.dataSource.query(
        sql,
        params,
      );

      const [row] = rows;

      if (!row) {
        throw new Error('No se pudo obtener el identificador generado');
      }

      return { id: Number(row.id) };
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const driverError = error.driverError as { code?: string } | undefined;
        if (driverError?.code === '23505') {
          throw new ConflictException({
            error: 'CONFLICT_ERROR',
            message: 'Los datos enviados no son validos',
            details: [
              {
                field: 'nombre',
                message: 'Ya existe un tipo de ambiente con ese nombre',
              },
            ],
          });
        }
      }

      throw error;
    }
  }

  async isNameTaken(nombre: string): Promise<boolean> {
    const sql = `
      SELECT 1 AS existe
      FROM infraestructura.tipo_ambientes
      WHERE nombre = $1
    `;

    const rows: Array<{ existe: number }> = await this.dataSource.query(sql, [
      nombre,
    ]);

    return rows.length > 0;
  }
}

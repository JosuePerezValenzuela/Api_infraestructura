import { Injectable, ConflictException } from '@nestjs/common';
import { BloqueRepositoryPort } from '../../domain/bloque.repository.port';
import { InjectDataSource } from '@nestjs/typeorm';
import { CreateBloqueCommand } from '../../domain/commands/create-bloque.command';
import { DataSource, QueryFailedError } from 'typeorm';

@Injectable()
export class TypeormBloqueRepository implements BloqueRepositoryPort {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async create(command: CreateBloqueCommand): Promise<{ id: number }> {
    const sql = `
      INSERT INTO infraestructura.bloques (codigo, nombre, nombre_corto, pisos, coordenadas, activo, facultad_id, tipo_bloque_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `;

    const params = [
      command.codigo,
      command.nombre,
      command.nombre_corto,
      command.pisos,
      command.pointLiteral,
      command.activo,
      command.facultad_id,
      command.tipo_bloque_id,
    ];

    try {
      const rows: [{ id: number }] = await this.dataSource.query(sql, params);

      const [row] = rows;

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
                message: 'Ya existe un tipo de bloque con ese nombre',
              },
            ],
          });
        }
      }
      throw error;
    }
  }

  async isCodeTaken(codigo: string): Promise<boolean> {
    const sql = `
      SELECT 1 AS existe
      FROM infraestructura.bloques
      WHERE codigo = $1
    `;

    const rows: Array<{ existe: number }> = await this.dataSource.query(sql, [
      codigo,
    ]);

    return rows.length > 0;
  }
}

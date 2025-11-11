import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, QueryFailedError } from 'typeorm';
import { TipoAmbienteRepositoryPort } from '../../domain/tipo-ambiente.repository.port';
import { CreateTipoAmbienteCommand } from '../../domain/commands/create-tipo-ambiente.command';
import {
  ListTipoAmbientesOptions,
  ListTipoAmbientesResult,
  TipoAmbienteListItem,
  TipoAmbienteOrderBy,
} from '../../domain/tipo-ambiente.list.types';
import { UpdateTipoAmbienteCommand } from '../../domain/commands/update-tipo-ambiente.command';

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

  async list(
    options: ListTipoAmbientesOptions,
  ): Promise<ListTipoAmbientesResult> {
    const search = options.search?.trim();
    const dataParams: Array<string | number> = [];
    const countParams: Array<string | number> = [];
    let whereClause = '';

    if (search && search.length > 0) {
      const pattern = `%${search}%`;
      whereClause = 'WHERE ta.nombre ILIKE $1';
      dataParams.push(pattern);
      countParams.push(pattern);
    }

    dataParams.push(options.take);
    const limitIndex = dataParams.length;
    dataParams.push((options.page - 1) * options.take);
    const offsetIndex = dataParams.length;

    const orderByMap: Record<TipoAmbienteOrderBy, string> = {
      nombre: 'ta.nombre',
      creado_en: 'ta.creado_en',
    };

    const dataSql = `
      SELECT
        ta.id,
        ta.nombre,
        ta.descripcion,
        ta.descripcion_corta,
        ta.activo,
        ta.creado_en,
        ta.actualizado_en
      FROM infraestructura.tipo_ambientes ta
      ${whereClause}
      ORDER BY ${orderByMap[options.orderBy]} ${options.orderDir.toUpperCase()}
      LIMIT $${limitIndex} OFFSET $${offsetIndex}
    `;

    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM infraestructura.tipo_ambientes ta
      ${whereClause}
    `;

    const rows = await this.dataSource.query<TipoAmbienteListItem[]>(
      dataSql,
      dataParams,
    );
    const countRows = await this.dataSource.query<Array<{ total: number }>>(
      countSql,
      countParams,
    );
    const total = countRows[0]?.total ?? 0;

    const items = rows.map((row) => ({
      id: Number(row.id),
      nombre: row.nombre,
      descripcion: row.descripcion,
      descripcion_corta: row.descripcion_corta ?? null,
      activo: row.activo,
      creado_en: new Date(row.creado_en),
      actualizado_en: new Date(row.actualizado_en),
    }));

    const pages = Math.max(1, Math.ceil(total / options.take));
    const hasNextPage = options.page < pages;
    const hasPreviousPage = options.page > 1;

    return {
      items,
      meta: {
        total,
        page: options.page,
        take: options.take,
        pages,
        hasNextPage,
        hasPreviousPage,
      },
    };
  }

  async delete(command: { id: number }): Promise<{ id: number }> {
    const exists = await this.dataSource.query<Array<{ id: number | string }>>(
      `
        SELECT id
        FROM infraestructura.tipo_ambientes
        WHERE id = $1
      `,
      [command.id],
    );

    if (!exists.length) {
      throw new NotFoundException({
        error: 'NOT_FOUND',
        message: 'No se encontro el tipo de ambiente',
        details: [{ field: 'id', message: 'El tipo de ambiente no existe' }],
      });
    }

    await this.dataSource.query(
      `
        DELETE FROM infraestructura.ambientes
        WHERE tipo_ambiente_id = $1
      `,
      [command.id],
    );

    const rows = await this.dataSource.query<Array<{ id: number | string }>>(
      `
        DELETE FROM infraestructura.tipo_ambientes
        WHERE id = $1
        RETURNING id
      `,
      [command.id],
    );

    const [row] = rows;

    return { id: Number(row.id) };
  }

  async findById(id: number): Promise<TipoAmbienteListItem | null> {
    const rows = await this.dataSource.query<
      Array<{
        id: number | string;
        nombre: string;
        descripcion: string;
        descripcion_corta: string | null;
        activo: boolean;
        creado_en: Date | string;
        actualizado_en: Date | string;
      }>
    >(
      `
        SELECT
          ta.id,
          ta.nombre,
          ta.descripcion,
          ta.descripcion_corta,
          ta.activo,
          ta.creado_en,
          ta.actualizado_en
        FROM infraestructura.tipo_ambientes ta
        WHERE ta.id = $1
      `,
      [id],
    );

    const [row] = rows;

    if (!row) {
      return null;
    }

    return {
      id: Number(row.id),
      nombre: row.nombre,
      descripcion: row.descripcion,
      descripcion_corta: row.descripcion_corta,
      activo: row.activo,
      creado_en: new Date(row.creado_en),
      actualizado_en: new Date(row.actualizado_en),
    };
  }

  async isNameTakenByOther(nombre: string, id: number): Promise<boolean> {
    const rows = await this.dataSource.query<Array<{ existe: number }>>(
      `
        SELECT 1 AS existe
        FROM infraestructura.tipo_ambientes
        WHERE nombre = $1 AND id <> $2
      `,
      [nombre, id],
    );

    return rows.length > 0;
  }

  async update(command: UpdateTipoAmbienteCommand): Promise<{ id: number }> {
    const fields: string[] = [];
    const params: Array<string | number | boolean | null> = [command.id];

    const pushField = (column: string, value: string | boolean | null) => {
      const index = params.length + 1;
      fields.push(`${column} = $${index}`);
      params.push(value);
    };

    if (command.nombre !== undefined) {
      pushField('nombre', command.nombre);
    }

    if (command.descripcion !== undefined) {
      pushField('descripcion', command.descripcion);
    }

    if (command.descripcion_corta !== undefined) {
      pushField('descripcion_corta', command.descripcion_corta);
    }

    if (command.activo !== undefined) {
      pushField('activo', command.activo);
    }

    fields.push('actualizado_en = CURRENT_TIMESTAMP');

    const sql = `
      UPDATE infraestructura.tipo_ambientes
      SET ${fields.join(', ')}
      WHERE id = $1
      RETURNING id
    `;

    const rows = await this.dataSource.query<Array<{ id: number | string }>>(
      sql,
      params,
    );

    const [row] = rows;

    if (!row) {
      throw new NotFoundException({
        error: 'NOT_FOUND',
        message: 'No se encontro el tipo de ambiente',
        details: [{ field: 'id', message: 'El tipo de ambiente no existe' }],
      });
    }

    return { id: Number(row.id) };
  }
}

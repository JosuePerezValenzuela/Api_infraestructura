import { ConflictException, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, QueryFailedError } from 'typeorm';
import {
  AmbienteRepositoryPort,
  CreateAmbienteResult,
} from '../../domain/ambiente.repository.port';
import { CreateAmbienteCommand } from '../../domain/commands/create-ambiente.command';
import { DeleteAmbienteCommand } from '../../domain/commands/delete-ambiente.command';
import { UpdateAmbienteCommand } from '../../domain/commands/update-ambiente.command';
import {
  AmbienteListItem,
  ListAmbientesOptions,
  ListAmbientesResult,
  AmbientItem,
  AmbienteCompletoItem,
} from '../../domain/ambiente.list.types';

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

  async delete(command: DeleteAmbienteCommand): Promise<{ id: number }> {
    const sql = `
      DELETE FROM infraestructura.ambientes
      WHERE id = $1
      RETURNING id
    `;
    const rows = await this.dataSource.query<{ id: number }[]>(sql, [
      command.id,
    ]);
    if (rows.length === 0) {
      return { id: command.id };
    }
    return { id: Number(rows[0].id) };
  }

  async deleteAssets(ambienteId: number): Promise<void> {
    const sql = `
      UPDATE infraestructura.activos
      SET ambiente_id = NULL
      WHERE ambiente_id = $1
    `;
    await this.dataSource.query(sql, [ambienteId]);
  }

  async update(command: UpdateAmbienteCommand): Promise<{ id: number }> {
    const setClauses: string[] = [];
    const params: (string | number | boolean | null | object)[] = [];
    let index = 1;

    const push = (
      clause: string,
      value: string | number | boolean | object | null,
    ) => {
      setClauses.push(`${clause} = $${index++}`);
      params.push(value);
    };

    if (command.codigo !== undefined) push('codigo', command.codigo);
    if (command.nombre !== undefined) push('nombre', command.nombre);
    if (command.nombre_corto !== undefined)
      push('nombre_corto', command.nombre_corto);
    if (command.piso !== undefined) push('piso', command.piso);
    if (command.capacidad !== undefined) push('capacidad', command.capacidad);
    if (command.dimension !== undefined) push('dimension', command.dimension);
    if (command.clases !== undefined) push('clases', command.clases);
    if (command.activo !== undefined) push('activo', command.activo);
    if (command.tipo_ambiente_id !== undefined)
      push('tipo_ambiente_id', command.tipo_ambiente_id);
    if (command.bloque_id !== undefined) push('bloque_id', command.bloque_id);

    if (setClauses.length === 0) {
      return { id: command.id };
    }

    const sql = `
      UPDATE infraestructura.ambientes
      SET ${setClauses.join(', ')}
      WHERE id = $${index}
      RETURNING id
    `;
    params.push(command.id);

    try {
      const rows = await this.dataSource.query<{ id: number }[]>(sql, params);
      if (rows.length === 0) {
        return { id: command.id };
      }
      return { id: command.id };
    } catch (error) {
      this.handleUniqueCodeError(error);
      throw error;
    }
  }

  async isCodeTaken(codigo: string, excludeId?: number): Promise<boolean> {
    let sql = `
      SELECT 1 AS existe
      FROM infraestructura.ambientes
      WHERE codigo = $1
    `;
    const params: (string | number)[] = [codigo];
    if (excludeId !== undefined) {
      sql += ' AND id <> $2';
      params.push(excludeId);
    }
    sql += ' LIMIT 1';

    const rows = await this.dataSource.query<{ existe: number }[]>(sql, params);
    return rows.length > 0;
  }

  async findById(id: number): Promise<AmbientItem | null> {
    const sql = `
      SELECT
        id,
        codigo,
        nombre,
        nombre_corto,
        piso,
        capacidad,
        dimension,
        clases,
        activo,
        creado_en,
        tipo_ambiente_id,
        bloque_id
      FROM infraestructura.ambientes
      WHERE id = $1
      LIMIT 1
    `;
    const rows = await this.dataSource.query<AmbientItem[]>(sql, [id]);
    if (rows.length === 0) {
      return null;
    }
    const [row] = rows;
    const capacidad = this.mapCapacidad(row.capacidad as unknown);
    const dimension = this.mapDimension(row.dimension as unknown);
    return {
      ...row,
      capacidad,
      dimension,
    };
  }

  async findByIdWithRelations(
    id: number,
  ): Promise<AmbienteCompletoItem | null> {
    const sql = `
      SELECT
        a.id,
        a.codigo,
        a.nombre,
        a.nombre_corto,
        a.piso,
        a.capacidad,
        a.dimension,
        a.clases,
        a.activo,
        a.creado_en,
        a.tipo_ambiente_id,
        a.bloque_id,
        b.nombre AS bloque_nombre,
        ta.nombre AS tipo_ambiente_nombre,
        tb.id AS tipo_bloque_id,
        tb.nombre AS tipo_bloque_nombre,
        f.id AS facultad_id,
        f.nombre AS facultad_nombre,
        c.id AS campus_id,
        c.nombre AS campus_nombre
      FROM infraestructura.ambientes a
      INNER JOIN infraestructura.bloques b ON b.id = a.bloque_id
      INNER JOIN infraestructura.campus_facultades cf ON cf.id = b.campus_facultad_id
      INNER JOIN infraestructura.campus c ON c.id = cf.campus_id
      INNER JOIN infraestructura.facultades f ON f.id = cf.facultad_id
      INNER JOIN infraestructura.tipo_ambientes ta ON ta.id = a.tipo_ambiente_id
      INNER JOIN infraestructura.tipo_bloques tb ON tb.id = b.tipo_bloque_id
      WHERE a.id = $1
      LIMIT 1
    `;
    const rows = await this.dataSource.query<AmbienteCompletoItem[]>(sql, [id]);
    if (rows.length === 0) {
      return null;
    }
    const [row] = rows;
    const capacidad = this.mapCapacidad(row.capacidad as unknown);
    const dimension = this.mapDimension(row.dimension as unknown);
    return {
      ...row,
      capacidad,
      dimension,
    };
  }

  async list(options: ListAmbientesOptions): Promise<ListAmbientesResult> {
    const { page, take } = options;
    const offset = (page - 1) * take;

    const dataParams: Array<string | number | boolean> = [];
    const countParams: Array<string | number | boolean> = [];
    const conditions: string[] = [];

    const pushCondition = (
      builder: (index: number) => string,
      values: Array<string | number | boolean>,
    ) => {
      const startIndex = dataParams.length + 1;
      dataParams.push(...values);
      countParams.push(...values);
      conditions.push(builder(startIndex));
    };

    if (options.search) {
      const pattern = `%${options.search}%`;
      pushCondition(
        (start) =>
          `(a.codigo ILIKE $${start} OR a.nombre ILIKE $${start + 1} OR a.nombre_corto ILIKE $${start + 2})`,
        [pattern, pattern, pattern],
      );
    }

    if (options.bloqueId !== null) {
      pushCondition((start) => `a.bloque_id = $${start}`, [options.bloqueId]);
    }

    if (options.campusId !== null) {
      pushCondition((start) => `c.id = $${start}`, [options.campusId]);
    }

    if (options.facultadId !== null) {
      pushCondition(
        (start) => `f.id = $${start}`,
        [options.facultadId],
      );
    }

    if (options.tipoAmbienteId !== null) {
      pushCondition(
        (start) => `a.tipo_ambiente_id = $${start}`,
        [options.tipoAmbienteId],
      );
    }

    if (options.activo !== null) {
      pushCondition((start) => `a.activo = $${start}`, [options.activo]);
    }

    if (options.clases !== null) {
      pushCondition((start) => `a.clases = $${start}`, [options.clases]);
    }

    if (options.pisoMin !== null) {
      pushCondition((start) => `a.piso >= $${start}`, [options.pisoMin]);
    }

    if (options.pisoMax !== null) {
      pushCondition((start) => `a.piso <= $${start}`, [options.pisoMax]);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const orderColumn = `a.${options.orderBy}`;
    const orderDirection = options.orderDir.toUpperCase();

    const dataSql = `
      SELECT
        a.id,
        a.codigo,
        a.nombre,
        a.nombre_corto,
        a.piso,
        a.capacidad,
        a.dimension,
        a.clases,
        a.activo,
        a.creado_en,
        b.id AS bloque_id,
        b.nombre AS bloque_nombre,
        ta.id AS tipo_ambiente_id,
        ta.nombre AS tipo_ambiente_nombre,
        c.id AS campus_id,
        c.nombre AS campus_nombre,
        f.id AS facultad_id,
        f.nombre AS facultad_nombre
      FROM infraestructura.ambientes a
      JOIN infraestructura.bloques b ON b.id = a.bloque_id
      JOIN infraestructura.campus_facultades cf ON cf.id = b.campus_facultad_id AND cf.activo = true
      JOIN infraestructura.campus c ON c.id = cf.campus_id AND c.activo = true
      JOIN infraestructura.facultades f ON f.id = cf.facultad_id AND f.activo = true
      JOIN infraestructura.tipo_ambientes ta ON ta.id = a.tipo_ambiente_id
      ${whereClause}
      ORDER BY ${orderColumn} ${orderDirection}
      LIMIT $${dataParams.length + 1}
      OFFSET $${dataParams.length + 2}
    `;

    dataParams.push(take, offset);

    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM infraestructura.ambientes a
      JOIN infraestructura.bloques b ON b.id = a.bloque_id
      JOIN infraestructura.campus_facultades cf ON cf.id = b.campus_facultad_id AND cf.activo = true
      JOIN infraestructura.campus c ON c.id = cf.campus_id AND c.activo = true
      JOIN infraestructura.facultades f ON f.id = cf.facultad_id AND f.activo = true
      JOIN infraestructura.tipo_ambientes ta ON ta.id = a.tipo_ambiente_id
      ${whereClause}
    `;

    const rows = await this.dataSource.query<AmbienteListItem[]>(
      dataSql,
      dataParams,
    );
    const countRows = await this.dataSource.query<{ total: number }[]>(
      countSql,
      countParams,
    );
    const total = countRows.length > 0 ? Number(countRows[0].total) : 0;
    const hasNextPage = page * take < total;
    const hasPreviousPage = page > 1;

    const items = rows.map((row) => {
      const capacidad = this.mapCapacidad(row.capacidad);
      const dimension = this.mapDimension(row.dimension);
      return {
        ...row,
        capacidad,
        dimension,
      };
    });

    return {
      items,
      meta: {
        total,
        page,
        take,
        hasNextPage,
        hasPreviousPage,
      },
    };
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

  private mapCapacidad(value: unknown): {
    total: number;
    examen: number;
  } {
    const data = this.ensureJsonObject(value);
    const total = Number(data.total ?? 0);
    const examen = Number(data.examen ?? 0);
    return { total, examen };
  }

  private mapDimension(value: unknown): {
    largo: number;
    ancho: number;
    alto: number;
    unid_med: string;
  } {
    const data = this.ensureJsonObject(value);
    return {
      largo: Number(data.largo ?? 0),
      ancho: Number(data.ancho ?? 0),
      alto: Number(data.alto ?? 0),
      unid_med: typeof data.unid_med === 'string' ? data.unid_med : 'metros',
    };
  }

  private ensureJsonObject(value: unknown): Record<string, unknown> {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value) as unknown;
        if (parsed && typeof parsed === 'object') {
          return parsed as Record<string, unknown>;
        }
      } catch {
        return {};
      }
    }

    if (value && typeof value === 'object') {
      return value as Record<string, unknown>;
    }

    return {};
  }
}

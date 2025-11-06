import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  BloqueRepositoryPort,
  BloqueSnapshot,
} from '../../domain/bloque.repository.port';
import { InjectDataSource } from '@nestjs/typeorm';
import { CreateBloqueCommand } from '../../domain/commands/create-bloque.command';
import { DataSource, QueryFailedError } from 'typeorm';
import {
  BloqueListOrderBy,
  ListBloquesOptions,
  ListBloquesResult,
} from '../../domain/bloque.list.types';
import { UpdateBloqueCommand } from '../../domain/commands/update-bloque.command';

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
                field: 'codigo',
                message: 'Ya existe un bloque con ese codigo',
              },
            ],
          });
        }
      }
      throw error;
    }
  }

  async isCodeTaken(codigo: string, excludeId?: number): Promise<boolean> {
    let sql = `
      SELECT 1 AS existe
      FROM infraestructura.bloques
      WHERE codigo = $1
    `;

    const params: (string | number)[] = [codigo];

    if (excludeId !== undefined) {
      sql += ' AND id <> $2';
      params.push(excludeId);
    }

    const rows = await this.dataSource.query<{ existe: number }[]>(sql, params);

    return rows.length > 0;
  }

  async list(options: ListBloquesOptions): Promise<ListBloquesResult> {
    const page = options.page;
    const take = options.take;

    const offset = (page - 1) * take;

    const dataParams: Array<string | number | boolean> = [];
    const countParams: Array<string | number | boolean> = [];

    const dataConditions: string[] = [];

    const pushCondition = (
      builder: (paramIndexStart: number) => string,
      values: Array<string | number | boolean>,
    ) => {
      const startIndex = dataParams.length + 1;

      dataParams.push(...values);
      countParams.push(...values);

      const clause = builder(startIndex);

      dataConditions.push(clause);
    };

    if (options.search) {
      const pattern = `%${options.search}%`;
      pushCondition(
        (start) =>
          `(b.codigo ILIKE $${start} OR b.nombre ILIKE $${start + 1} OR b.nombre_corto ILIKE $${start + 2})`,
        [pattern, pattern, pattern],
      );
    }

    if (options.facultadId !== null) {
      pushCondition(
        (start) => `b.facultad_id = $${start}`,
        [options.facultadId],
      );
    }

    if (options.tipoBloqueId !== null) {
      pushCondition(
        (start) => `b.tipo_bloque_id = $${start}`,
        [options.tipoBloqueId],
      );
    }

    if (options.activo !== null) {
      pushCondition((start) => `b.activo = $${start}`, [options.activo]);
    }

    if (options.pisosMin !== null) {
      pushCondition((start) => `b.pisos >= $${start}`, [options.pisosMin]);
    }

    if (options.pisosMax !== null) {
      pushCondition((start) => `b.pisos <= $${start}`, [options.pisosMax]);
    }

    const whereClause =
      dataConditions.length > 0 ? `WHERE ${dataConditions.join(' AND ')}` : '';

    let dataSql = `
      SELECT
        b.id,
        b.codigo,
        b.nombre,
        b.nombre_corto,
        b.pisos,
        b.activo,
        b.creado_en,
        f.nombre AS facultad_nombre,
        tb.nombre AS tipo_bloque_nombre
      FROM infraestructura.bloques b
      JOIN infraestructura.facultades f ON f.id = b.facultad_id
      JOIN infraestructura.tipo_bloques tb ON tb.id = b.tipo_bloque_id
    `;

    if (whereClause !== '') {
      dataSql += whereClause;
    }

    const orderByMap: Record<BloqueListOrderBy, string> = {
      codigo: 'b.codigo',
      nombre: 'b.nombre',
      pisos: 'b.pisos',
      activo: 'b.activo',
      creado_en: 'b.creado_en',
    };

    const orderColumn = orderByMap[options.orderBy];
    const orderDirection = options.orderDir.toUpperCase();

    dataSql += ` ORDER BY ${orderColumn} ${orderDirection}`;

    dataSql += ` LIMIT $${dataParams.length + 1} OFFSET $${dataParams.length + 2}`;
    dataParams.push(options.take, offset);

    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM infraestructura.bloques b
      JOIN infraestructura.facultades f ON f.id = b.facultad_id
      JOIN infraestructura.tipo_bloques tb ON tb.id = b.tipo_bloque_id
      ${whereClause}
    `;

    const rows = await this.dataSource.query<
      Array<{
        id: number | string;
        codigo: string;
        nombre: string;
        nombre_corto: string | null;
        pisos: number | string;
        activo: boolean;
        creado_en: Date | string;
        facultad_nombre: string;
        tipo_bloque_nombre: string;
      }>
    >(dataSql, dataParams);

    const countRows: Array<{ total: number }> = await this.dataSource.query(
      countSql,
      countParams,
    );

    const total = countRows[0]?.total ?? 0;

    const items = rows.map((row) => ({
      id: Number(row.id),
      codigo: row.codigo,
      nombre: row.nombre,
      nombre_corto: row.nombre_corto,
      pisos: Number(row.pisos),
      activo: row.activo,
      creado_en: new Date(row.creado_en).toISOString(),
      facultad_nombre: row.facultad_nombre,
      tipo_bloque_nombre: row.tipo_bloque_nombre,
    }));

    const hasNextPage = options.page * options.take < total;
    const hasPreviousPage = options.page > 1;

    return {
      items,
      meta: {
        total,
        page: options.page,
        take: options.take,
        hasNextPage,
        hasPreviousPage,
      },
    };
  }

  async findById(id: number): Promise<BloqueSnapshot | null> {
    const sql = `
      SELECT
        b.id,
        b.codigo,
        b.nombre,
        b.nombre_corto,
        b.pisos,
        b.activo,
        b.facultad_id,
        b.tipo_bloque_id,
        (b.coordenadas)[1]:: float AS lng,
        (b.coordenadas)[2]:: float AS lat
      FROM infraestructura.bloques b
      WHERE b.id = $1
      LIMIT 1
    `;
    const rows = await this.dataSource.query<
      {
        id: number;
        codigo: string;
        nombre: string;
        nombre_corto: string | null;
        pisos: number;
        activo: boolean;
        facultad_id: number;
        tipo_bloque_id: number;
        lat: number | null;
        lng: number | null;
      }[]
    >(sql, [id]);

    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    return {
      id: Number(row.id),
      codigo: row.codigo,
      nombre: row.nombre,
      nombre_corto: row.nombre_corto,
      pisos: Number(row.pisos),
      activo: row.activo,
      facultad_id: Number(row.facultad_id),
      tipo_bloque_id: Number(row.tipo_bloque_id),
      coordenadas:
        row.lat !== null && row.lng !== null
          ? { lat: Number(row.lat), lng: Number(row.lng) }
          : { lat: 0, lng: 0 },
    };
  }

  async update(command: UpdateBloqueCommand): Promise<{ id: number }> {
    const setClauses: string[] = [];
    const params: (string | number | boolean | null)[] = [];
    let paramIndex = 1;

    const pushUpdate = (
      clause: string,
      value: string | number | boolean | null,
    ) => {
      setClauses.push(`${clause} = $${paramIndex++}`);
      params.push(value);
    };

    if (command.codigo !== undefined) {
      pushUpdate('codigo', command.codigo);
    }

    if (command.nombre !== undefined) {
      pushUpdate('nombre', command.nombre);
    }

    if (command.nombre_corto !== undefined) {
      pushUpdate('nombre_corto', command.nombre_corto);
    }

    if (command.pisos !== undefined) {
      pushUpdate('pisos', command.pisos);
    }

    if (command.coordinates !== undefined) {
      pushUpdate('coordenadas', `(${command.coordinates.pointLiteral})`);
    }

    if (command.activo !== undefined) {
      pushUpdate('activo', command.activo);
    }

    if (command.facultad_id !== undefined) {
      pushUpdate('facultad_id', command.facultad_id);
    }

    if (command.tipo_bloque_id !== undefined) {
      pushUpdate('tipo_bloque_id', command.tipo_bloque_id);
    }

    if (setClauses.length === 0) {
      throw new NotFoundException('No hay campos para actualizar');
    }

    const sql = `
      UPDATE infraestructura.bloques
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id
    `;
    params.push(command.id);

    try {
      await this.dataSource.query<{ id: number }[]>(sql, params);
      return { id: command.id };
    } catch (error) {
      this.handleUniqueCodeError(error);
      throw error;
    }
  }

  private handleUniqueCodeError(error: unknown): void {
    if (error instanceof QueryFailedError) {
      const driverError = error.driverError as { code?: string } | undefined;
      if (driverError?.code == '23505') {
        throw new ConflictException({
          error: 'CONFLICT_ERROR',
          message: 'Los datos enviados no son validos',
          details: [
            {
              field: 'codigo',
              message: 'Ya existe un bloque con ese codigo',
            },
          ],
        });
      }
    }
  }
}

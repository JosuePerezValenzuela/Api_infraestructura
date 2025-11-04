import { Injectable, ConflictException } from '@nestjs/common';
import { BloqueRepositoryPort } from '../../domain/bloque.repository.port';
import { InjectDataSource } from '@nestjs/typeorm';
import { CreateBloqueCommand } from '../../domain/commands/create-bloque.command';
import { DataSource, QueryFailedError } from 'typeorm';
import {
  BloqueListOrderBy,
  ListBloquesOptions,
  ListBloquesResult,
} from '../../domain/bloque.list.types';

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
}

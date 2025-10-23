import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, QueryFailedError } from 'typeorm';
import { ConflictException, Injectable } from '@nestjs/common';
import { CreateTipoBloqueCommand } from '../../domain/commands/create-tipo-bloque.command';
import { TipoBloqueRepositoryPort } from '../../domain/tipo-bloque.repository.port';
import {
  ListTipoBloquesOptions,
  ListTipoBloquesResult,
  TipoBloqueOrderBy,
} from '../../domain/tipo-bloque.list.types';

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

  async list(options: ListTipoBloquesOptions): Promise<ListTipoBloquesResult> {
    const search = options.search?.trim();
    const offset = (options.page - 1) * options.take;
    const dataParams: Array<string | number> = [];
    const countParams: Array<string | number> = [];

    if (search && search.length > 0) {
      const pattern = `%${search}%`;
      dataParams.push(pattern);
      countParams.push(pattern);
    }

    dataParams.push(options.take);
    const limitParamIndex = dataParams.length;
    dataParams.push(offset);
    const offsetParamIndex = dataParams.length;

    const orderByMap: Record<TipoBloqueOrderBy, string> = {
      nombre: 'tb.nombre',
      descripcion: 'tb.descripcion',
      creado_en: 'tb.creado_en',
    };

    let dataSql = `
      SELECT
        tb.id,
        tb.nombre,
        tb.descripcion,
        tb.activo,
        tb.creado_en,
        tb.actualizado_en
      FROM infraestructura.tipo_bloques tb
    `;

    if (search && search.length > 0) {
      dataSql += ` WHERE tb.nombre ILIKE $1`;
    }

    dataSql += ` ORDER BY ${orderByMap[options.orderBy]} ${options.orderDir.toUpperCase()}`;

    dataSql += ` LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}`;

    let countSql = `
      SELECT COUNT(*)::int AS total
      FROM infraestructura.tipo_bloques tb
    `;

    if (options.search && options.search.length > 0) {
      countSql += ` WHERE tb.nombre ILIKE $1`;
    }

    const rows = await this.dataSource.query<
      Array<{
        id: number | string;
        nombre: string;
        descripcion: string;
        activo: boolean;
        creado_en: string | Date;
        actualizado_en: string | Date;
      }>
    >(dataSql, dataParams);

    const countRows = await this.dataSource.query<
      Array<{ total: number | string }>
    >(countSql, countParams);
    const total = countRows.length > 0 ? Number(countRows[0].total) : 0;

    const items = rows.map((row) => ({
      id: Number(row.id),
      nombre: row.nombre,
      descripcion: row.descripcion,
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
}

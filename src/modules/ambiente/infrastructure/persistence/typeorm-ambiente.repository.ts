import { ConflictException, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, QueryFailedError } from 'typeorm';
import {
  AmbienteRepositoryPort,
  CreateAmbienteResult,
} from '../../domain/ambiente.repository.port';
import { CreateAmbienteCommand } from '../../domain/commands/create-ambiente.command';
import {
  AmbienteListItem,
  ListAmbientesOptions,
  ListAmbientesResult,
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

    if (options.facultadId !== null) {
      pushCondition(
        (start) => `b.facultad_id = $${start}`,
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
        b.nombre AS bloque_nombre,
        f.nombre AS facultad_nombre,
        ta.nombre AS tipo_ambiente_nombre
      FROM infraestructura.ambientes a
      JOIN infraestructura.bloques b ON b.id = a.bloque_id
      JOIN infraestructura.facultades f ON f.id = b.facultad_id
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
      JOIN infraestructura.facultades f ON f.id = b.facultad_id
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

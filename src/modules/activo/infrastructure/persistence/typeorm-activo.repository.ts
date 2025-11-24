import { ConflictException, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, QueryFailedError } from 'typeorm';
import { ActivoRepositoryPort } from '../../domain/activo.repository.port';
import {
  ActivoListItem,
  ListActivosOptions,
  ListActivosResult,
} from '../../domain/activo.list.types';
import { CreateActivoCommand } from '../../domain/commands/create-activo.command';

// Repositorio TypeORM que ejecuta SQL crudo para leer activos.
// Incluimos comentarios cortos para explicar cada paso de la construccion de la consulta.
@Injectable()
export class TypeormActivoRepository implements ActivoRepositoryPort {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async create(command: CreateActivoCommand): Promise<{ id: number }> {
    // SQL parametrizado para insertar el activo.
    const sql = `
      INSERT INTO infraestructura.activos (
        nia,
        nombre,
        descripcion,
        ambiente_id
      )
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `;
    // Arreglo con los valores en el mismo orden que el SQL.
    const params = [
      command.nia,
      command.nombre,
      command.descripcion ?? null,
      command.ambiente_id ?? null,
    ];

    try {
      // Ejecutamos el query y extraemos el id generado.
      const rows = await this.dataSource.query<{ id: number }[]>(sql, params);
      const [row] = rows;
      return { id: Number(row.id) };
    } catch (error) {
      // Si es un error de clave duplicada, lo convertimos a ConflictException.
      this.handleUniqueNiaError(error);
      throw error;
    }
  }

  async isNiaTaken(nia: string): Promise<boolean> {
    // Consulta rapida para saber si existe un NIA igual.
    const sql = `
      SELECT 1 AS existe
      FROM infraestructura.activos
      WHERE nia = $1
      LIMIT 1
    `;
    const rows = await this.dataSource.query<{ existe: number }[]>(sql, [nia]);
    // Si hay filas, significa que el NIA ya esta tomado.
    return rows.length > 0;
  }

  async list(options: ListActivosOptions): Promise<ListActivosResult> {
    // Calculamos el offset a partir de la pagina solicitada.
    const offset = (options.page - 1) * options.take;

    // Arreglos paralelos para los parametros de la consulta de datos y de conteo.
    const dataParams: Array<string | number> = [];
    const countParams: Array<string | number> = [];
    // Lista de condiciones dinamicas para la clausula WHERE.
    const conditions: string[] = [];

    // Utilidad local: agrega una condicion y acumula los valores en ambos arreglos de parametros.
    const pushCondition = (
      builder: (index: number) => string,
      values: Array<string | number>,
    ) => {
      const startIndex = dataParams.length + 1;
      dataParams.push(...values);
      countParams.push(...values);
      conditions.push(builder(startIndex));
    };

    // Si hay texto de busqueda, construimos un patron para nia, nombre o descripcion.
    if (options.search) {
      const pattern = `%${options.search}%`;
      pushCondition(
        (start) =>
          `(a.nia ILIKE $${start} OR a.nombre ILIKE $${start + 1} OR a.descripcion ILIKE $${start + 2})`,
        [pattern, pattern, pattern],
      );
    }

    // Si se filtro por ambiente, agregamos la condicion exacta.
    if (options.ambienteId !== null) {
      pushCondition((start) => `a.ambiente_id = $${start}`, [
        options.ambienteId,
      ]);
    }

    // Armamos la clausula WHERE final concatenando las condiciones que se hayan agregado.
    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Ordenamos solo por columnas permitidas, ya validadas en el caso de uso.
    const orderColumn = `a.${options.orderBy}`;
    const orderDirection = options.orderDir.toUpperCase();

    // Consulta de datos con join a ambientes para enriquecer la respuesta.
    const dataSql = `
      SELECT
        a.id,
        a.nia,
        a.nombre,
        a.descripcion,
        a.creado_en,
        a.ambiente_id,
        amb.nombre AS ambiente_nombre,
        amb.codigo AS ambiente_codigo
      FROM infraestructura.activos a
      LEFT JOIN infraestructura.ambientes amb ON amb.id = a.ambiente_id
      ${whereClause}
      ORDER BY ${orderColumn} ${orderDirection}
      LIMIT $${dataParams.length + 1}
      OFFSET $${dataParams.length + 2}
    `;

    // Agregamos limit y offset al final de los parametros de datos.
    dataParams.push(options.take, offset);

    // Consulta de conteo para paginacion.
    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM infraestructura.activos a
      LEFT JOIN infraestructura.ambientes amb ON amb.id = a.ambiente_id
      ${whereClause}
    `;

    // Ejecutamos ambas consultas en la misma conexion.
    const rows = await this.dataSource.query<ActivoListItem[]>(
      dataSql,
      dataParams,
    );
    const countRows = await this.dataSource.query<{ total: number }[]>(
      countSql,
      countParams,
    );

    // Normalizamos el total y calculamos banderas de paginacion.
    const total = countRows.length > 0 ? Number(countRows[0].total) : 0;
    const hasNextPage = options.page * options.take < total;
    const hasPreviousPage = options.page > 1;

    // Ajustamos tipos y valores nulos de cada fila antes de devolver.
    const items = rows.map((row) => ({
      ...row,
      id: Number(row.id),
      ambiente_id: row.ambiente_id === null ? null : Number(row.ambiente_id),
      descripcion: row.descripcion ?? null,
      ambiente_nombre: row.ambiente_nombre ?? null,
      ambiente_codigo: row.ambiente_codigo ?? null,
    }));

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

  private handleUniqueNiaError(error: unknown): void {
    // Detectamos el codigo de error de Postgres para clave duplicada.
    if (error instanceof QueryFailedError) {
      const driverError = error.driverError as { code?: string } | undefined;
      if (driverError?.code === '23505') {
        // Re-lanzamos un ConflictException con el formato estandar.
        throw new ConflictException({
          error: 'CONFLICT_ERROR',
          message: 'Los datos enviados no son validos',
          details: [{ field: 'nia', message: 'Ya existe un activo con ese NIA' }],
        });
      }
    }
  }
}

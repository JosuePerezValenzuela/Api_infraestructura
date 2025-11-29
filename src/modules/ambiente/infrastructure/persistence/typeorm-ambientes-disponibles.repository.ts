import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  AmbientesDisponiblesRepositoryPort,
  AmbientesDisponiblesRepositoryPort as DisponiblesRepoToken,
} from '../../domain/ambiente.disponibles.port';
import {
  AmbienteDisponibleItem,
  ListAmbientesDisponiblesQuery,
  ListAmbientesDisponiblesResult,
} from '../../domain/ambiente.disponibles.types';

export class TypeormAmbientesDisponiblesRepository
  implements AmbientesDisponiblesRepositoryPort
{
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async listDisponibles(
    query: ListAmbientesDisponiblesQuery,
  ): Promise<ListAmbientesDisponiblesResult> {
    const page = query.page ?? 1;
    const take = query.take ?? 10;
    const offset = (page - 1) * take;

    const conditions: string[] = [];
    const dataParams: Array<number | string | number[]> = [];
    const countParams: Array<number | string | number[]> = [];

    const pushCondition = (
      builder: (start: number) => string,
      values: Array<number | string | number[]>,
    ) => {
      const startIndex = dataParams.length + 1;
      dataParams.push(...values);
      countParams.push(...values);
      conditions.push(builder(startIndex));
    };

    if (query.capacidad_min !== undefined) {
      pushCondition(
        (start) => `(a.capacidad->>'total')::int >= $${start}`,
        [query.capacidad_min],
      );
    }

    if (query.capacidad_examen_min !== undefined) {
      pushCondition(
        (start) => `(a.capacidad->>'examen')::int >= $${start}`,
        [query.capacidad_examen_min],
      );
    }

    if (query.tipo_ambiente_ids?.length) {
      pushCondition(
        (start) => `a.tipo_ambiente_id = ANY($${start})`,
        [query.tipo_ambiente_ids],
      );
    }

    if (query.campus_ids?.length) {
      pushCondition(
        (start) => `f.campus_id = ANY($${start})`,
        [query.campus_ids],
      );
    }

    if (query.facultad_ids?.length) {
      pushCondition((start) => `f.id = ANY($${start})`, [query.facultad_ids]);
    }

    if (query.bloque_ids?.length) {
      pushCondition((start) => `b.id = ANY($${start})`, [query.bloque_ids]);
    }

    if (query.tipo_bloque_ids?.length) {
      pushCondition(
        (start) => `b.tipo_bloque_id = ANY($${start})`,
        [query.tipo_bloque_ids],
      );
    }

    if (query.horario) {
      pushCondition(
        (start) =>
          `EXISTS (SELECT 1 FROM infraestructura.horarios h WHERE h.ambiente_id = a.id AND h.dia = $${start} AND h.hora_inicio <= $${start + 1} AND h.hora_fin >= $${start + 2})`,
        [query.horario.dia, query.horario.hora_inicio, query.horario.hora_fin],
      );
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const orderBy = query.orderBy ?? 'nombre';
    const orderDir = (query.orderDir ?? 'asc').toUpperCase();
    const orderColumn = `a.${orderBy}`;

    const dataSql = `
      SELECT
        a.id,
        a.codigo,
        a.nombre,
        a.nombre_corto,
        a.piso,
        a.capacidad,
        a.clases,
        a.activo,
        a.bloque_id,
        f.id AS facultad_id,
        f.campus_id,
        b.tipo_bloque_id,
        a.tipo_ambiente_id
      FROM infraestructura.ambientes a
      JOIN infraestructura.bloques b ON b.id = a.bloque_id
      JOIN infraestructura.facultades f ON f.id = b.facultad_id
      ${whereClause}
      ORDER BY ${orderColumn} ${orderDir}
      LIMIT $${dataParams.length + 1}
      OFFSET $${dataParams.length + 2}
    `;

    dataParams.push(take, offset);

    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM infraestructura.ambientes a
      JOIN infraestructura.bloques b ON b.id = a.bloque_id
      JOIN infraestructura.facultades f ON f.id = b.facultad_id
      ${whereClause}
    `;

    const rows = await this.dataSource.query<AmbienteDisponibleItem[]>(
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

    const items = rows.map((row) => ({
      ...row,
      capacidad: this.mapCapacidad(row.capacidad as unknown),
    }));

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

  private mapCapacidad(value: unknown): { total: number; examen: number } {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value) as Record<string, unknown>;
        return {
          total: Number(parsed.total ?? 0),
          examen: Number(parsed.examen ?? 0),
        };
      } catch {
        return { total: 0, examen: 0 };
      }
    }

    if (value && typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      return {
        total: Number(obj.total ?? 0),
        examen: Number(obj.examen ?? 0),
      };
    }

    return { total: 0, examen: 0 };
  }
}

export const typeormAmbientesDisponiblesProviders = [
  {
    provide: DisponiblesRepoToken,
    useClass: TypeormAmbientesDisponiblesRepository,
  },
];

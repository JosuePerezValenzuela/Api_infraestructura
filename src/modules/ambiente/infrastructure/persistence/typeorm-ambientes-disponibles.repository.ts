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

type DisponiblesDbRow = {
  id: number;
  codigo: string;
  nombre: string;
  nombre_corto: string | null;
  piso: number;
  capacidad: unknown;
  clases: boolean;
  activo: boolean;
  bloque_id: number;
  bloque_nombre: string;
  facultad_id: number;
  facultad_nombre: string;
  campus_id: number;
  campus_nombre: string;
  tipo_bloque_id: number;
  tipo_bloque_nombre: string;
  tipo_ambiente_id: number;
  tipo_ambiente_nombre: string;
};

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

    if (query.capacidad_examen_min !== undefined && !query.mismo_piso) {
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

    conditions.unshift('a.activo = TRUE');
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
        b.nombre AS bloque_nombre,
        f.id AS facultad_id,
        f.nombre AS facultad_nombre,
        f.campus_id,
        c.nombre AS campus_nombre,
        b.tipo_bloque_id,
        tb.nombre AS tipo_bloque_nombre,
        a.tipo_ambiente_id,
        ta.nombre AS tipo_ambiente_nombre
      FROM infraestructura.ambientes a
      JOIN infraestructura.bloques b ON b.id = a.bloque_id
      JOIN infraestructura.facultades f ON f.id = b.facultad_id
      JOIN infraestructura.campus c ON c.id = f.campus_id
      JOIN infraestructura.tipo_bloques tb ON tb.id = b.tipo_bloque_id
      JOIN infraestructura.tipo_ambientes ta ON ta.id = a.tipo_ambiente_id
      ${whereClause}
      ORDER BY ${orderColumn} ${orderDir}
    `;

    const rows = await this.dataSource.query<DisponiblesDbRow[]>(
      dataSql,
      dataParams,
    );

    const grouped = this.groupAmbientes(rows, query);
    const total = grouped.length;
    const paged = grouped.slice(offset, offset + take);
    const hasNextPage = page * take < total;
    const hasPreviousPage = page > 1;

    return {
      items: paged,
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

  private groupAmbientes(
    rows: DisponiblesDbRow[],
    query: ListAmbientesDisponiblesQuery,
  ): ListAmbientesDisponiblesResult['items'] {
    const groups = new Map<
      string,
      ListAmbientesDisponiblesResult['items'][number]
    >();

    for (const raw of rows) {
      const capacidad = this.mapCapacidad(raw.capacidad as unknown);
      const ambient: AmbienteDisponibleItem = {
        id: Number(raw.id),
        codigo: String(raw.codigo),
        nombre: String(raw.nombre),
        nombre_corto:
          raw.nombre_corto === null ? null : String(raw.nombre_corto),
        piso: Number(raw.piso),
        capacidad,
        clases: Boolean(raw.clases),
        activo: Boolean(raw.activo),
        tipo_ambiente_id: Number(raw.tipo_ambiente_id),
        tipo_ambiente_nombre: String(raw.tipo_ambiente_nombre),
      };

      const key = `${raw.bloque_id}-${raw.piso}`;

      if (!groups.has(key)) {
        groups.set(key, {
          campus_id: Number(raw.campus_id),
          campus_nombre: String(raw.campus_nombre),
          facultad_id: Number(raw.facultad_id),
          facultad_nombre: String(raw.facultad_nombre),
          bloque_id: Number(raw.bloque_id),
          bloque_nombre: String(raw.bloque_nombre),
          tipo_bloque_id: Number(raw.tipo_bloque_id),
          tipo_bloque_nombre: String(raw.tipo_bloque_nombre),
          piso: Number(raw.piso),
          capacidad_examen_total: 0,
          ambientes: [],
        });
      }

      const group = groups.get(key);
      if (!group) {
        continue;
      }
      group.capacidad_examen_total += capacidad.examen;
      group.ambientes.push(ambient);
    }

    let result = Array.from(groups.values());

    if (query.mismo_piso && query.capacidad_examen_min !== undefined) {
      result = result.filter(
        (g) => g.capacidad_examen_total >= query.capacidad_examen_min!,
      );
    }

    const orderBy = query.orderBy ?? 'nombre';
    const orderDir = query.orderDir ?? 'asc';
    const compare = (
      a: (typeof result)[number],
      b: (typeof result)[number],
    ) => {
      const getValue = (group: (typeof result)[number]) => {
        if (orderBy === 'piso') return group.piso;
        const first = group.ambientes[0];
        return orderBy === 'codigo' ? first.codigo : first.nombre;
      };
      const va = getValue(a);
      const vb = getValue(b);
      if (va < vb) return orderDir === 'asc' ? -1 : 1;
      if (va > vb) return orderDir === 'asc' ? 1 : -1;
      return 0;
    };

    result.sort(compare);
    return result;
  }
}

export const typeormAmbientesDisponiblesProviders = [
  {
    provide: DisponiblesRepoToken,
    useClass: TypeormAmbientesDisponiblesRepository,
  },
];

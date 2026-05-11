import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DashboardBloqueRepositoryPort } from '../domain/dashboard-bloque.repository.port';
import {
  DashboardBloqueDetailFilters,
  DashboardBloqueDetailResult,
} from '../domain/dashboard-bloque.types';

@Injectable()
export class DashboardBloqueTypeormRepository implements DashboardBloqueRepositoryPort {
  constructor(private readonly dataSource: DataSource) {}

  // ------------------------------------------------------------
  // DASHBOARD DETALLE DE BLOQUE
  // ------------------------------------------------------------
  async getDetailDashboard(
    filters: DashboardBloqueDetailFilters,
  ): Promise<DashboardBloqueDetailResult | null> {
    const { bloqueId, includeInactive } = filters;

    const bActivoFilter = includeInactive ? '' : 'AND b.activo = TRUE';
    const aActivoFilter = includeInactive ? '' : 'AND a.activo = TRUE';

    // 1) Verificar existencia del bloque
    const bloqueRows = await this.dataSource.query(
      `
      SELECT
        b.id, b.nombre, b.nombre_corto, b.activo, b.pisos,
        tb.id AS tipo_bloque_id, tb.nombre AS tipo_bloque_nombre,
        f.id AS facultad_id, f.nombre AS facultad_nombre,
        c.id AS campus_id, c.nombre AS campus_nombre
      FROM infraestructura.bloques b
      LEFT JOIN infraestructura.campus_facultades cf ON cf.id = b.campus_facultad_id
      LEFT JOIN infraestructura.facultades f ON f.id = cf.facultad_id
      LEFT JOIN infraestructura.campus c ON c.id = cf.campus_id
      LEFT JOIN infraestructura.tipo_bloques tb ON tb.id = b.tipo_bloque_id
      WHERE b.id = $1 ${bActivoFilter}
      `,
      [bloqueId],
    );

    if (!bloqueRows.length) return null;
    const bloque = bloqueRows[0] as {
      id: string;
      nombre: string;
      nombre_corto: string | null;
      activo: boolean;
      pisos: string;
      tipo_bloque_id: string;
      tipo_bloque_nombre: string;
      facultad_id: string;
      facultad_nombre: string;
      campus_id: string;
      campus_nombre: string;
    };

    // 2) KPIs y sumatorias
    const summaryRows = await this.dataSource.query(
      `
      SELECT
        COUNT(DISTINCT a.id) FILTER (WHERE a.id IS NOT NULL) AS ambientes_total,
        COUNT(DISTINCT a.id) FILTER (WHERE a.activo = TRUE) AS ambientes_activos,
        COUNT(DISTINCT a.id) FILTER (WHERE a.activo = FALSE) AS ambientes_inactivos,
        COALESCE(SUM((a.capacidad->>'total')::int), 0) AS capacidad_total,
        COALESCE(SUM((a.capacidad->>'examen')::int), 0) AS capacidad_examen,
        COUNT(act.id) FILTER (WHERE act.id IS NOT NULL) AS activos_asignados
      FROM infraestructura.bloques b
      LEFT JOIN infraestructura.ambientes a ON a.bloque_id = b.id ${aActivoFilter}
      LEFT JOIN infraestructura.activos act ON act.ambiente_id = a.id
      WHERE b.id = $1
      `,
      [bloqueId],
    );

    const summary = summaryRows[0] ?? {
      ambientes_total: 0,
      ambientes_activos: 0,
      ambientes_inactivos: 0,
      capacidad_total: 0,
      capacidad_examen: 0,
      activos_asignados: 0,
    };

    // 3) Chart - tipos de ambiente
    const tiposAmbienteRows = await this.dataSource.query(
      `
      SELECT ta.nombre AS tipo_ambiente_nombre, COUNT(*)::int AS cantidad
      FROM infraestructura.bloques b
      LEFT JOIN infraestructura.ambientes a ON a.bloque_id = b.id ${aActivoFilter}
      INNER JOIN infraestructura.tipo_ambientes ta ON ta.id = a.tipo_ambiente_id
      WHERE b.id = $1
      GROUP BY ta.nombre
      ORDER BY cantidad DESC
      `,
      [bloqueId],
    );

    // 4) Por ambiente (lista de ambientes de este bloque)
    const ambientesRows = await this.dataSource.query(
      `
      SELECT
        a.id AS ambiente_id,
        a.nombre AS ambiente_nombre,
        a.piso,
        (a.capacidad->>'total')::int AS capacidad_total,
        (a.capacidad->>'examen')::int AS capacidad_examen,
        ta.nombre AS tipo_ambiente_nombre,
        COUNT(act.id)::int AS activos_asignados
      FROM infraestructura.bloques b
      LEFT JOIN infraestructura.ambientes a ON a.bloque_id = b.id ${aActivoFilter}
      LEFT JOIN infraestructura.tipo_ambientes ta ON ta.id = a.tipo_ambiente_id
      LEFT JOIN infraestructura.activos act ON act.ambiente_id = a.id
      WHERE b.id = $1
      GROUP BY a.id, a.nombre, a.piso, a.capacidad, ta.nombre
      ORDER BY a.piso, a.nombre
      `,
      [bloqueId],
    );

    // 5) Activos no asignados globales
    const unassignedRows = await this.dataSource.query(
      `SELECT cantidad FROM mv_dashboard_activos_no_asignados`,
    );
    const sinAsignarGlobal = unassignedRows[0]?.cantidad ?? 0;

    return {
      schemaVersion: 2,
      filtersApplied: { bloqueId, includeInactive },
      layout: { mode: 'detail' },
      data: {
        bloque: {
          id: Number(bloque.id),
          nombre: bloque.nombre,
          nombreCorto: bloque.nombre_corto ?? null,
          activo: Boolean(bloque.activo),
          pisos: Number(bloque.pisos ?? 0),
          tipoBloqueId: Number(bloque.tipo_bloque_id),
          tipoBloqueNombre: bloque.tipo_bloque_nombre,
          facultadId: Number(bloque.facultad_id),
          facultadNombre: bloque.facultad_nombre,
          campusId: Number(bloque.campus_id),
          campusNombre: bloque.campus_nombre,
        },
        kpis: {
          ambientes: {
            total: Number(summary.ambientes_total ?? 0),
            activos: Number(summary.ambientes_activos ?? 0),
            inactivos: Number(summary.ambientes_inactivos ?? 0),
          },
          capacidad: {
            total: Number(summary.capacidad_total ?? 0),
            examen: Number(summary.capacidad_examen ?? 0),
          },
          activos: {
            asignados: Number(summary.activos_asignados ?? 0),
            sinAsignarGlobal,
          },
        },
        charts: {
          tiposAmbiente: (tiposAmbienteRows as { tipo_ambiente_nombre: string; cantidad: string }[]).map(
            (row) => ({
              tipo: row.tipo_ambiente_nombre,
              cantidad: Number(row.cantidad),
            }),
          ),
        },
        porAmbiente: (ambientesRows as { ambiente_id: string; ambiente_nombre: string; piso: string; capacidad_total: string; capacidad_examen: string; tipo_ambiente_nombre: string; activos_asignados: string }[]).map((row) => ({
          id: Number(row.ambiente_id),
          nombre: row.ambiente_nombre,
          piso: Number(row.piso),
          capacidad: {
            total: Number(row.capacidad_total),
            examen: Number(row.capacidad_examen),
          },
          tipoAmbiente: row.tipo_ambiente_nombre,
          activos: { asignados: Number(row.activos_asignados) },
        })),
      },
    };
  }
}
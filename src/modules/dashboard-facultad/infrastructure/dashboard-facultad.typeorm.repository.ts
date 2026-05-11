import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DashboardFacultadRepositoryPort } from '../domain/dashboard-facultad.repository.port';
import {
  DashboardFacultadDetailFilters,
  DashboardFacultadDetailResult,
} from '../domain/dashboard-facultad.types';

// ============================================================
// TIPOS AUXILIARES
// ============================================================

type FacultadRow = {
  id: number;
  nombre: string;
  nombre_corto: string | null;
  activo: boolean;
  campus_id: number;
  campus_nombre: string;
};

type BloqueSummaryRow = {
  bloque_id: number;
  bloque_nombre: string;
  ambientes_total: number;
  ambientes_activos: number;
  ambientes_inactivos: number;
  capacidad_total: number;
  capacidad_examen: number;
  activos_asignados: number;
};

type TipoBloqueRow = {
  tipo_bloque_id: number;
  tipo_bloque_nombre: string;
  cantidad: number;
};

type TipoAmbienteRow = {
  tipo_ambiente_id: number;
  tipo_ambiente_nombre: string;
  cantidad: number;
};

// ============================================================
// MAPPERS
// ============================================================

function mapBloqueSummaryRows(raw: unknown[]): BloqueSummaryRow[] {
  return (raw as BloqueSummaryRow[]).map((row) => ({
    bloque_id: Number(row.bloque_id),
    bloque_nombre: row.bloque_nombre,
    ambientes_total: Number(row.ambientes_total ?? 0),
    ambientes_activos: Number(row.ambientes_activos ?? 0),
    ambientes_inactivos: Number(row.ambientes_inactivos ?? 0),
    capacidad_total: Number(row.capacidad_total ?? 0),
    capacidad_examen: Number(row.capacidad_examen ?? 0),
    activos_asignados: Number(row.activos_asignados ?? 0),
  }));
}

// ============================================================
// REPOSITORY
// ============================================================

@Injectable()
export class DashboardFacultadTypeormRepository
  implements DashboardFacultadRepositoryPort {
  constructor(private readonly dataSource: DataSource) {}

  // ------------------------------------------------------------
  // DASHBOARD DETALLE DE FACULTAD
  // ------------------------------------------------------------
  async getDetailDashboard(
    filters: DashboardFacultadDetailFilters,
  ): Promise<DashboardFacultadDetailResult | null> {
    const { facultadId, includeInactive } = filters;

    const activoFilter = includeInactive ? '' : 'AND f.activo = TRUE';
    const cfActivoFilter = includeInactive ? '' : 'AND cf.activo = TRUE';
    const bActivoFilter = includeInactive ? '' : 'AND b.activo = TRUE';
    const aActivoFilter = includeInactive ? '' : 'AND a.activo = TRUE';

    // 1) Verificar existencia de la facultad
    const facultadRows = await this.dataSource.query(
      `
      SELECT 
        f.id, f.nombre, f.nombre_corto, f.activo,
        c.id AS campus_id, c.nombre AS campus_nombre
      FROM infraestructura.facultades f
      LEFT JOIN infraestructura.campus_facultades cf ON cf.facultad_id = f.id
      LEFT JOIN infraestructura.campus c ON c.id = cf.campus_id
      WHERE f.id = $1 ${activoFilter}
      `,
      [facultadId],
    );

    if (!facultadRows.length) return null;
    const facultad = facultadRows[0] as FacultadRow;

    // 2) KPIs y sumatorias (JOINs corregidos usando campus_facultades)
    const summaryRows = await this.dataSource.query(
      `
      SELECT
        COUNT(DISTINCT b.id) FILTER (WHERE b.id IS NOT NULL) AS bloques_total,
        COUNT(DISTINCT b.id) FILTER (WHERE b.activo = TRUE) AS bloques_activos,
        COUNT(DISTINCT b.id) FILTER (WHERE b.activo = FALSE) AS bloques_inactivos,
        COUNT(DISTINCT a.id) FILTER (WHERE a.id IS NOT NULL) AS ambientes_total,
        COUNT(DISTINCT a.id) FILTER (WHERE a.activo = TRUE) AS ambientes_activos,
        COUNT(DISTINCT a.id) FILTER (WHERE a.activo = FALSE) AS ambientes_inactivos,
        COALESCE(SUM((a.capacidad->>'total')::int), 0) AS capacidad_total,
        COALESCE(SUM((a.capacidad->>'examen')::int), 0) AS capacidad_examen,
        COUNT(act.id) FILTER (WHERE act.id IS NOT NULL) AS activos_asignados
      FROM infraestructura.facultades f
      LEFT JOIN infraestructura.campus_facultades cf ON cf.facultad_id = f.id ${cfActivoFilter}
      LEFT JOIN infraestructura.bloques b ON b.campus_facultad_id = cf.id
      LEFT JOIN infraestructura.ambientes a ON a.bloque_id = b.id
      LEFT JOIN infraestructura.activos act ON act.ambiente_id = a.id
      WHERE f.id = $1 ${bActivoFilter} ${aActivoFilter}
      `,
      [facultadId],
    );

    const summary = summaryRows[0] ?? {
      bloques_total: 0,
      bloques_activos: 0,
      bloques_inactivos: 0,
      ambientes_total: 0,
      ambientes_activos: 0,
      ambientes_inactivos: 0,
      capacidad_total: 0,
      capacidad_examen: 0,
      activos_asignados: 0,
    };

    // 3) Tipos de bloque
    const tiposBloqueRows = await this.dataSource.query(
      `
      SELECT tb.id AS tipo_bloque_id, tb.nombre AS tipo_bloque_nombre, COUNT(*)::int AS cantidad
      FROM infraestructura.facultades f
      LEFT JOIN infraestructura.campus_facultades cf ON cf.facultad_id = f.id ${cfActivoFilter}
      LEFT JOIN infraestructura.bloques b ON b.campus_facultad_id = cf.id ${bActivoFilter}
      INNER JOIN infraestructura.tipo_bloques tb ON tb.id = b.tipo_bloque_id
      WHERE f.id = $1
      GROUP BY tb.id, tb.nombre
      ORDER BY cantidad DESC
      `,
      [facultadId],
    );

    // 4) Tipos de ambiente
    const tiposAmbienteRows = await this.dataSource.query(
      `
      SELECT ta.id AS tipo_ambiente_id, ta.nombre AS tipo_ambiente_nombre, COUNT(*)::int AS cantidad
      FROM infraestructura.facultades f
      LEFT JOIN infraestructura.campus_facultades cf ON cf.facultad_id = f.id ${cfActivoFilter}
      LEFT JOIN infraestructura.bloques b ON b.campus_facultad_id = cf.id
      LEFT JOIN infraestructura.ambientes a ON a.bloque_id = b.id ${aActivoFilter}
      INNER JOIN infraestructura.tipo_ambientes ta ON ta.id = a.tipo_ambiente_id
      WHERE f.id = $1
      GROUP BY ta.id, ta.nombre
      ORDER BY cantidad DESC
      `,
      [facultadId],
    );

    // 5) Por bloque (lista de bloques de esta facultad)
    const bloquesRows = await this.dataSource.query(
      `
      SELECT
        b.id AS bloque_id,
        b.nombre AS bloque_nombre,
        COUNT(DISTINCT a.id) FILTER (WHERE a.id IS NOT NULL) AS ambientes_total,
        COUNT(DISTINCT a.id) FILTER (WHERE a.activo = TRUE) AS ambientes_activos,
        COUNT(DISTINCT a.id) FILTER (WHERE a.activo = FALSE) AS ambientes_inactivos,
        COALESCE(SUM((a.capacidad->>'total')::int), 0) AS capacidad_total,
        COALESCE(SUM((a.capacidad->>'examen')::int), 0) AS capacidad_examen,
        COUNT(act.id) FILTER (WHERE act.id IS NOT NULL) AS activos_asignados
      FROM infraestructura.facultades f
      LEFT JOIN infraestructura.campus_facultades cf ON cf.facultad_id = f.id ${cfActivoFilter}
      LEFT JOIN infraestructura.bloques b ON b.campus_facultad_id = cf.id ${bActivoFilter}
      LEFT JOIN infraestructura.ambientes a ON a.bloque_id = b.id
      LEFT JOIN infraestructura.activos act ON act.ambiente_id = a.id
      WHERE f.id = $1
      GROUP BY b.id, b.nombre
      ORDER BY b.nombre ASC
      `,
      [facultadId],
    );
    const bloques = mapBloqueSummaryRows(bloquesRows);

    // 6) Activos no asignados globales
    const unassignedRows = await this.dataSource.query(
      `SELECT cantidad FROM mv_dashboard_activos_no_asignados`,
    );
    const sinAsignarGlobal = unassignedRows[0]?.cantidad ?? 0;

    return {
      schemaVersion: 2,
      filtersApplied: { facultadId, includeInactive },
      layout: { mode: 'detail' },
      data: {
        facultad: {
          id: Number(facultad.id),
          nombre: facultad.nombre,
          nombreCorto: facultad.nombre_corto ?? null,
          activo: Boolean(facultad.activo),
          campusId: Number(facultad.campus_id),
          campusNombre: facultad.campus_nombre,
        },
        kpis: {
          bloques: {
            total: Number(summary.bloques_total ?? 0),
            activos: Number(summary.bloques_activos ?? 0),
            inactivos: Number(summary.bloques_inactivos ?? 0),
          },
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
          tiposBloque: (tiposBloqueRows as TipoBloqueRow[]).map((row) => ({
            tipo: row.tipo_bloque_nombre,
            cantidad: Number(row.cantidad ?? 0),
          })),
          tiposAmbiente: (tiposAmbienteRows as TipoAmbienteRow[]).map((row) => ({
            tipo: row.tipo_ambiente_nombre,
            cantidad: Number(row.cantidad ?? 0),
          })),
        },
        porBloque: bloques.map((row) => ({
          id: row.bloque_id,
          nombre: row.bloque_nombre,
          ambientes: row.ambientes_total,
          capacidad: {
            total: row.capacidad_total,
            examen: row.capacidad_examen,
          },
          activos: { asignados: row.activos_asignados },
        })),
      },
    };
  }
}
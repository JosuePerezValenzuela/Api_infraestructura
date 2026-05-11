import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  DashboardDetailFilters,
  DashboardDetailResult,
  DashboardGlobalFilters,
  DashboardGlobalResult,
} from '../domain/dashboard-campus.types';
import { DashboardCampusRepositoryPort } from '../domain/dashboard-campus.repository.port';

// ============================================================
// TIPOS AUXILIARES - Filas que vienen de la BD
// ============================================================

type CampusSummaryRow = {
  campus_id: number;
  campus_nombre: string;
  campus_activo: boolean;
  facultades_total: number;
  facultades_activos: number;
  facultades_inactivos: number;
  bloques_total: number;
  bloques_activos: number;
  bloques_inactivos: number;
  ambientes_total: number;
  ambientes_activos: number;
  ambientes_inactivos: number;
  capacidad_total: number;
  capacidad_examen: number;
  activos_asignados: number;
};

type TipoBloqueRow = {
  campus_id: number;
  campus_nombre: string;
  tipo_bloque_nombre: string;
  cantidad: number;
};

type TipoAmbienteRow = {
  campus_id: number;
  campus_nombre: string;
  tipo_ambiente_nombre: string;
  cantidad: number;
};

// ============================================================
// MÉTODOS AUXILIARES (DRY)
// ============================================================

/** Mapea filas de resumen por campus */
function mapCampusSummaryRows(raw: unknown[]): CampusSummaryRow[] {
  return (raw as CampusSummaryRow[]).map((row) => ({
    campus_id: Number(row.campus_id),
    campus_nombre: row.campus_nombre,
    campus_activo: Boolean(row.campus_activo),
    facultades_total: Number(row.facultades_total ?? 0),
    facultades_activos: Number(row.facultades_activos ?? 0),
    facultades_inactivos: Number(row.facultades_inactivos ?? 0),
    bloques_total: Number(row.bloques_total ?? 0),
    bloques_activos: Number(row.bloques_activos ?? 0),
    bloques_inactivos: Number(row.bloques_inactivos ?? 0),
    ambientes_total: Number(row.ambientes_total ?? 0),
    ambientes_activos: Number(row.ambientes_activos ?? 0),
    ambientes_inactivos: Number(row.ambientes_inactivos ?? 0),
    capacidad_total: Number(row.capacidad_total ?? 0),
    capacidad_examen: Number(row.capacidad_examen ?? 0),
    activos_asignados: Number(row.activos_asignados ?? 0),
  }));
}

/** Construye filtros dinámicos para las queries */
function buildFilters(includeInactive: boolean, campusIds?: number[]) {
  return {
    campusFilter: campusIds && campusIds.length > 0 ? 'AND c.id = ANY($1)' : '',
    activoFilter: includeInactive ? '' : 'AND c.activo = TRUE',
    cfActivoFilter: includeInactive ? '' : 'AND cf.activo = TRUE',
    fActivoFilter: includeInactive ? '' : 'AND f.activo = TRUE',
    campusIdsParam: campusIds && campusIds.length > 0 ? [campusIds] : [],
  };
}

/** Calcula KPIs globales a partir de las filas de campus */
function calculateKPIs(
  campusRows: CampusSummaryRow[],
  noAsignados: number,
) {
  return {
    campus: {
      total: campusRows.length,
      activos: campusRows.filter((r) => r.campus_activo).length,
      inactivos: campusRows.filter((r) => !r.campus_activo).length,
    },
    facultades: {
      total: campusRows.reduce((sum, r) => sum + r.facultades_total, 0),
      activos: campusRows.reduce((sum, r) => sum + r.facultades_activos, 0),
      inactivos: campusRows.reduce((sum, r) => sum + r.facultades_inactivos, 0),
    },
    bloques: {
      total: campusRows.reduce((sum, r) => sum + r.bloques_total, 0),
      activos: campusRows.reduce((sum, r) => sum + r.bloques_activos, 0),
      inactivos: campusRows.reduce((sum, r) => sum + r.bloques_inactivos, 0),
    },
    ambientes: {
      total: campusRows.reduce((sum, r) => sum + r.ambientes_total, 0),
      activos: campusRows.reduce((sum, r) => sum + r.ambientes_activos, 0),
      inactivos: campusRows.reduce((sum, r) => sum + r.ambientes_inactivos, 0),
    },
    capacidad: {
      total: campusRows.reduce((sum, r) => sum + r.capacidad_total, 0),
      examen: campusRows.reduce((sum, r) => sum + r.capacidad_examen, 0),
    },
    activos: {
      asignados: campusRows.reduce((sum, r) => sum + r.activos_asignados, 0),
      sinAsignar: noAsignados,
    },
  };
}

/** Agrupa tipos por campus */
function groupTiposPorCampus<T extends { campus_id: number; campus_nombre: string }>(
  rows: T[],
  getCantidad: (row: T) => number,
  getTipo: (row: T) => string,
) {
  const map = new Map<
    number,
    { nombre: string; cantidadTotal: number; tipos: { tipo: string; cantidad: number }[] }
  >();

  for (const row of rows) {
    if (!map.has(row.campus_id)) {
      map.set(row.campus_id, {
        nombre: row.campus_nombre,
        cantidadTotal: 0,
        tipos: [],
      });
    }
    const entry = map.get(row.campus_id)!;
    entry.cantidadTotal += getCantidad(row);
    entry.tipos.push({ tipo: getTipo(row), cantidad: getCantidad(row) });
  }

  return Array.from(map.values()).map((entry) => ({
    nombre: entry.nombre,
    cantidadTotal: entry.cantidadTotal,
    tipos: entry.tipos,
  }));
}

// ============================================================
// REPOSITORIO
// ============================================================

@Injectable()
export class DashboardCampusTypeormRepository
  implements DashboardCampusRepositoryPort
{
  constructor(private readonly dataSource: DataSource) {}

  // ------------------------------------------------------------
  // DASHBOARD GLOBAL - Usando Materialized Views
  // ------------------------------------------------------------
  async getGlobalDashboard(
    filters: DashboardGlobalFilters,
  ): Promise<DashboardGlobalResult> {
    const { includeInactive, campusIds } = filters;

    // Query 1: Resumen por campus desde MV (mucho más rápido)
    const summaryRaw = await this.dataSource.query(
      `SELECT * FROM mv_dashboard_campus_resumen`,
    );
    let campusRows = mapCampusSummaryRows(summaryRaw);

    // Query 2: Tipos de bloque por campus desde MV
    const tiposBloqueRaw = await this.dataSource.query(
      `SELECT * FROM mv_dashboard_tipos_bloque`,
    );
    let tiposBloqueRows = tiposBloqueRaw as TipoBloqueRow[];

    // Query 3: Tipos de ambiente por campus desde MV
    const tiposAmbienteRaw = await this.dataSource.query(
      `SELECT * FROM mv_dashboard_tipos_ambiente`,
    );
    let tiposAmbienteRows = tiposAmbienteRaw as TipoAmbienteRow[];

    // Query 4: Activos no asignados desde MV
    const unassignedRows = await this.dataSource.query(
      `SELECT cantidad FROM mv_dashboard_activos_no_asignados`,
    );
    const noAsignados = unassignedRows[0]?.cantidad ?? 0;

    // Aplicar filtros en memoria (rápido porque ya tenemos los datos)
    if (campusIds && campusIds.length > 0) {
      campusRows = campusRows.filter((r) => campusIds.includes(r.campus_id));
      tiposBloqueRows = tiposBloqueRows.filter((r) => campusIds.includes(r.campus_id));
      tiposAmbienteRows = tiposAmbienteRows.filter((r) => campusIds.includes(r.campus_id));
    }

    if (!includeInactive) {
      campusRows = campusRows.filter((r) => r.campus_activo);
      // Los tipos también se filtran según los campuses activos
      const activeCampusIds = campusRows.map((r) => r.campus_id);
      tiposBloqueRows = tiposBloqueRows.filter((r) => activeCampusIds.includes(r.campus_id));
      tiposAmbienteRows = tiposAmbienteRows.filter((r) => activeCampusIds.includes(r.campus_id));
    }

    // Calcular KPIs
    const kpis = calculateKPIs(campusRows, noAsignados);

    // Rankings
    const rankings = {
      porCantidadAmbientes: campusRows
        .map((r) => ({ campusId: r.campus_id, nombre: r.campus_nombre, cantidad: r.ambientes_total }))
        .sort((a, b) => b.cantidad - a.cantidad),
      porCapacidadTotal: campusRows
        .map((r) => ({ campusId: r.campus_id, nombre: r.campus_nombre, capacidad: r.capacidad_total }))
        .sort((a, b) => b.capacidad - a.capacidad),
    };

    // Distribuciones
    const distribuciones = {
      tiposBloquePorCampus: groupTiposPorCampus(
        tiposBloqueRows,
        (r) => r.cantidad,
        (r) => r.tipo_bloque_nombre,
      ),
      tiposAmbientePorCampus: groupTiposPorCampus(
        tiposAmbienteRows,
        (r) => r.cantidad,
        (r) => r.tipo_ambiente_nombre,
      ),
    };

    // Lista por campus
    const porCampus = campusRows.map((row) => ({
      id: row.campus_id,
      nombre: row.campus_nombre,
      facultades: row.facultades_total,
      bloques: row.bloques_total,
      ambientes: row.ambientes_total,
      capacidad: { total: row.capacidad_total, examen: row.capacidad_examen },
      activos: { asignados: row.activos_asignados, sinAsignar: 0 },
    }));

    return {
      schemaVersion: 1,
      filtersApplied: { campusIds, includeInactive },
      layout: { mode: 'global' },
      data: { kpis, rankings, distribuciones, porCampus },
    };
  }

  // ------------------------------------------------------------
  // DASHBOARD DETALLE - Código existente (JOINTS aún por corregir)
  // ------------------------------------------------------------
  async getDetailDashboard(
    filters: DashboardDetailFilters,
  ): Promise<DashboardDetailResult | null> {
    const { campusId, includeInactive } = filters;

    const activeCampusFilter = includeInactive ? '' : 'AND c.activo = TRUE';

    // 1) Verificar existencia del campus
    const campusRows = await this.dataSource.query(
      `SELECT c.id, c.nombre, c.activo FROM infraestructura.campus c WHERE c.id = $1 ${activeCampusFilter}`,
      [campusId],
    );

    if (!campusRows.length) return null;
    const campus = campusRows[0];

    // 2) KPIs y sumatorias (JOINs viejos -有待修复)
    const summaryRows = await this.dataSource.query(
      `
      SELECT
        COUNT(DISTINCT f.id) FILTER (WHERE f.id IS NOT NULL) AS facultades_total,
        COUNT(DISTINCT f.id) FILTER (WHERE f.activo = TRUE) AS facultades_activos,
        COUNT(DISTINCT f.id) FILTER (WHERE f.activo = FALSE) AS facultades_inactivos,
        COUNT(DISTINCT b.id) FILTER (WHERE b.id IS NOT NULL) AS bloques_total,
        COUNT(DISTINCT b.id) FILTER (WHERE b.activo = TRUE) AS bloques_activos,
        COUNT(DISTINCT b.id) FILTER (WHERE b.activo = FALSE) AS bloques_inactivos,
        COUNT(DISTINCT a.id) FILTER (WHERE a.id IS NOT NULL) AS ambientes_total,
        COUNT(DISTINCT a.id) FILTER (WHERE a.activo = TRUE) AS ambientes_activos,
        COUNT(DISTINCT a.id) FILTER (WHERE a.activo = FALSE) AS ambientes_inactivos,
        COALESCE(SUM((a.capacidad->>'total')::int), 0) AS capacidad_total,
        COALESCE(SUM((a.capacidad->>'examen')::int), 0) AS capacidad_examen,
        COUNT(act.id) FILTER (WHERE act.id IS NOT NULL) AS activos_asignados
      FROM infraestructura.campus c
      LEFT JOIN infraestructura.facultades f ON f.campus_id = c.id
      LEFT JOIN infraestructura.bloques b ON b.facultad_id = f.id
      LEFT JOIN infraestructura.ambientes a ON a.bloque_id = b.id
      LEFT JOIN infraestructura.activos act ON act.ambiente_id = a.id
      WHERE c.id = $1 ${includeInactive ? '' : 'AND f.activo = TRUE AND b.activo = TRUE AND a.activo = TRUE'}
      `,
      [campusId],
    );

    const summary = summaryRows[0] ?? {
      facultades_total: 0,
      facultades_activos: 0,
      facultades_inactivos: 0,
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
      FROM infraestructura.bloques b
      INNER JOIN infraestructura.tipo_bloques tb ON tb.id = b.tipo_bloque_id
      INNER JOIN infraestructura.facultades f ON f.id = b.facultad_id
      WHERE f.campus_id = $1 ${includeInactive ? '' : 'AND b.activo = TRUE'}
      GROUP BY tb.id, tb.nombre
      ORDER BY cantidad DESC
      `,
      [campusId],
    );

    // 4) Tipos de ambiente
    const tiposAmbienteRows = await this.dataSource.query(
      `
      SELECT ta.id AS tipo_ambiente_id, ta.nombre AS tipo_ambiente_nombre, COUNT(*)::int AS cantidad
      FROM infraestructura.ambientes a
      INNER JOIN infraestructura.tipo_ambientes ta ON ta.id = a.tipo_ambiente_id
      INNER JOIN infraestructura.bloques b ON b.id = a.bloque_id
      INNER JOIN infraestructura.facultades f ON f.id = b.facultad_id
      WHERE f.campus_id = $1 ${includeInactive ? '' : 'AND a.activo = TRUE'}
      GROUP BY ta.id, ta.nombre
      ORDER BY cantidad DESC
      `,
      [campusId],
    );

    // 5) Tabla de facultades
    const facultadesRows = await this.dataSource.query(
      `
      SELECT
        f.id AS facultad_id, f.nombre AS facultad_nombre,
        COUNT(DISTINCT b.id) AS bloques, COUNT(DISTINCT b.tipo_bloque_id) AS tipos_bloque,
        COUNT(DISTINCT a.id) AS ambientes, COUNT(DISTINCT a.tipo_ambiente_id) AS tipos_ambiente,
        COALESCE(SUM((a.capacidad->>'total')::int), 0) AS capacidad_total,
        COALESCE(SUM((a.capacidad->>'examen')::int), 0) AS capacidad_examen,
        COUNT(act.id) FILTER (WHERE act.id IS NOT NULL) AS activos_asignados
      FROM infraestructura.facultades f
      LEFT JOIN infraestructura.bloques b ON b.facultad_id = f.id
      LEFT JOIN infraestructura.ambientes a ON a.bloque_id = b.id
      LEFT JOIN infraestructura.activos act ON act.ambiente_id = a.id
      WHERE f.campus_id = $1 ${includeInactive ? '' : 'AND f.activo = TRUE AND b.activo = TRUE AND a.activo = TRUE'}
      GROUP BY f.id, f.nombre
      ORDER BY f.nombre ASC
      `,
      [campusId],
    );

    // 6) Activos no asignados
    const unassignedRows = await this.dataSource.query(
      `SELECT COUNT(*)::int AS no_asignados FROM infraestructura.activos act WHERE act.ambiente_id IS NULL`,
    );
    const noAsignados = unassignedRows[0]?.no_asignados ?? 0;

    return {
      schemaVersion: 1,
      filtersApplied: { campusId, includeInactive },
      layout: { mode: 'detail' },
      data: {
        campus: { id: Number(campus.id), nombre: campus.nombre, activo: campus.activo },
        kpis: {
          facultades: { activos: Number(summary.facultades_activos ?? 0), inactivos: Number(summary.facultades_inactivos ?? 0) },
          bloques: { activos: Number(summary.bloques_activos ?? 0), inactivos: Number(summary.bloques_inactivos ?? 0) },
          ambientes: { activos: Number(summary.ambientes_activos ?? 0), inactivos: Number(summary.ambientes_inactivos ?? 0) },
          capacidad: { total: Number(summary.capacidad_total ?? 0), examen: Number(summary.capacidad_examen ?? 0) },
          activos: { asignados: Number(summary.activos_asignados ?? 0), noAsignadosGlobal: noAsignados },
        },
        charts: {
          tiposBloque: tiposBloqueRows.map((row) => ({
            tipoBloqueId: Number(row.tipo_bloque_id),
            tipoBloqueNombre: row.tipo_bloque_nombre,
            cantidad: Number(row.cantidad ?? 0),
          })),
          tiposAmbiente: tiposAmbienteRows.map((row) => ({
            tipoAmbienteId: Number(row.tipo_ambiente_id),
            tipoAmbienteNombre: row.tipo_ambiente_nombre,
            cantidad: Number(row.cantidad ?? 0),
          })),
        },
        tables: {
          facultadesResumen: facultadesRows.map((row) => ({
            facultadId: Number(row.facultad_id),
            facultadNombre: row.facultad_nombre,
            bloques: Number(row.bloques ?? 0),
            tiposBloque: Number(row.tipos_bloque ?? 0),
            ambientes: Number(row.ambientes ?? 0),
            tiposAmbiente: Number(row.tipos_ambiente ?? 0),
            capacidadTotal: Number(row.capacidad_total ?? 0),
            capacidadExamen: Number(row.capacidad_examen ?? 0),
            activosAsignados: Number(row.activos_asignados ?? 0),
          })),
        },
      },
    };
  }
}
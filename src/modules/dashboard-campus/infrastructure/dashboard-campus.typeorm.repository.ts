import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  DashboardDetailFilters,
  DashboardDetailResult,
  DashboardGlobalFilters,
  DashboardGlobalResult,
} from '../domain/dashboard-campus.types';
import { DashboardCampusRepositoryPort } from '../domain/dashboard-campus.repository.port';

// Tipos auxiliares de filas para el dashboard global.
type GlobalAggregateRow = {
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
  tipos_bloque: number;
  tipos_ambiente: number;
  activos_asignados: number;
};

// Repositorio TypeORM que consulta PostgreSQL para construir los dashboards global y detalle.
@Injectable()
export class DashboardCampusTypeormRepository implements DashboardCampusRepositoryPort {
  constructor(private readonly dataSource: DataSource) {}

  // Tipado de filas devueltas por la agregacion global para evitar usar `any`.
  private mapGlobalRows(raw: unknown[]): GlobalAggregateRow[] {
    return (raw as GlobalAggregateRow[]).map((row) => ({
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
      tipos_bloque: Number(row.tipos_bloque ?? 0),
      tipos_ambiente: Number(row.tipos_ambiente ?? 0),
      activos_asignados: Number(row.activos_asignados ?? 0),
    }));
  }

  // Obtiene el dashboard global aplicando filtros de campusIds e includeInactive.
  async getGlobalDashboard(
    filters: DashboardGlobalFilters,
  ): Promise<DashboardGlobalResult> {
    const includeInactive = filters.includeInactive;
    const campusIds = filters.campusIds;

    // Construimos partes dinamicas para filtrar por campusIds e incluir/excluir inactivos.
    const campusFilter =
      campusIds && campusIds.length > 0 ? `AND c.id = ANY($1)` : ''; // $1 es opcional segun el parametro

    const activeFilter = includeInactive ? '' : 'AND c.activo = TRUE';

    // Query principal: agrega todos los conteos y sumatorias por campus.
    const rawRows: unknown[] = await this.dataSource.query(
      `
      SELECT
        c.id AS campus_id,
        c.nombre AS campus_nombre,
        c.activo AS campus_activo,
        -- Facultades
        COUNT(DISTINCT f.id) FILTER (WHERE f.id IS NOT NULL) AS facultades_total,
        COUNT(DISTINCT f.id) FILTER (WHERE f.activo = TRUE) AS facultades_activos,
        COUNT(DISTINCT f.id) FILTER (WHERE f.activo = FALSE) AS facultades_inactivos,
        -- Bloques
        COUNT(DISTINCT b.id) FILTER (WHERE b.id IS NOT NULL) AS bloques_total,
        COUNT(DISTINCT b.id) FILTER (WHERE b.activo = TRUE) AS bloques_activos,
        COUNT(DISTINCT b.id) FILTER (WHERE b.activo = FALSE) AS bloques_inactivos,
        -- Ambientes
        COUNT(DISTINCT a.id) FILTER (WHERE a.id IS NOT NULL) AS ambientes_total,
        COUNT(DISTINCT a.id) FILTER (WHERE a.activo = TRUE) AS ambientes_activos,
        COUNT(DISTINCT a.id) FILTER (WHERE a.activo = FALSE) AS ambientes_inactivos,
        -- Capacidades
        COALESCE(SUM((a.capacidad->>'total')::int), 0) AS capacidad_total,
        COALESCE(SUM((a.capacidad->>'examen')::int), 0) AS capacidad_examen,
        -- Tipos distinct
        COUNT(DISTINCT b.tipo_bloque_id) AS tipos_bloque,
        COUNT(DISTINCT a.tipo_ambiente_id) AS tipos_ambiente,
        -- Activos asignados
        COUNT(act.id) FILTER (WHERE act.id IS NOT NULL) AS activos_asignados
      FROM infraestructura.campus c
      LEFT JOIN infraestructura.facultades f ON f.campus_id = c.id
      LEFT JOIN infraestructura.bloques b ON b.facultad_id = f.id
      LEFT JOIN infraestructura.ambientes a ON a.bloque_id = b.id
      LEFT JOIN infraestructura.activos act ON act.ambiente_id = a.id
      WHERE 1=1
      ${campusFilter}
      ${activeFilter}
      GROUP BY c.id, c.nombre, c.activo
      ORDER BY c.nombre ASC
    `,
      campusFilter ? [campusIds] : [],
    );
    const rows = this.mapGlobalRows(rawRows);

    // Query de activos no asignados global.
    const unassignedRows: Array<{ no_asignados: number }> =
      await this.dataSource.query(
        `
      SELECT COUNT(*)::int AS no_asignados
      FROM infraestructura.activos act
      WHERE act.ambiente_id IS NULL
    `,
      );

    const noAsignados = unassignedRows[0]?.no_asignados ?? 0;

    // Totales globales para calcular porcentajes.
    const totalAmbientes = rows.reduce(
      (sum, row) => sum + row.ambientes_total,
      0,
    );
    const totalActivosAsignados = rows.reduce(
      (sum, row) => sum + row.activos_asignados,
      0,
    );

    // KPIs generales.
    const kpis = {
      campus: {
        activos: rows.filter((r) => r.campus_activo === true).length,
        inactivos: rows.filter((r) => r.campus_activo === false).length,
      },
      facultades: {
        activos: rows.reduce((sum, r) => sum + r.facultades_activos, 0),
        inactivos: rows.reduce((sum, r) => sum + r.facultades_inactivos, 0),
      },
      bloques: {
        activos: rows.reduce((sum, r) => sum + r.bloques_activos, 0),
        inactivos: rows.reduce((sum, r) => sum + r.bloques_inactivos, 0),
      },
      ambientes: {
        activos: rows.reduce((sum, r) => sum + r.ambientes_activos, 0),
        inactivos: rows.reduce((sum, r) => sum + r.ambientes_inactivos, 0),
      },
      capacidad: {
        total: rows.reduce((sum, r) => sum + r.capacidad_total, 0),
        examen: rows.reduce((sum, r) => sum + r.capacidad_examen, 0),
      },
      activos: {
        total: totalActivosAsignados + noAsignados,
        asignados: totalActivosAsignados,
        noAsignadosGlobal: noAsignados,
      },
    };

    // Charts
    const rankingAmbientesPorCampus = rows
      .map((row) => ({
        campusId: row.campus_id,
        campusNombre: row.campus_nombre,
        ambientes: row.ambientes_total,
        pctGlobal:
          totalAmbientes > 0
            ? Number(((row.ambientes_total * 100) / totalAmbientes).toFixed(2))
            : 0,
      }))
      .sort((a, b) => b.ambientes - a.ambientes);

    const capacidadTotalPorCampus = rows.map((row) => ({
      campusId: row.campus_id,
      campusNombre: row.campus_nombre,
      capacidadTotal: row.capacidad_total,
      pctGlobal:
        kpis.capacidad.total > 0
          ? Number(
              ((row.capacidad_total * 100) / kpis.capacidad.total).toFixed(2),
            )
          : 0,
    }));

    const capacidadExamenPorCampus = rows.map((row) => ({
      campusId: row.campus_id,
      campusNombre: row.campus_nombre,
      capacidadExamen: row.capacidad_examen,
      pctGlobal:
        kpis.capacidad.examen > 0
          ? Number(
              ((row.capacidad_examen * 100) / kpis.capacidad.examen).toFixed(2),
            )
          : 0,
    }));

    const activosPorCampus = [
      ...rows.map((row) => ({
        campusId: row.campus_id,
        campusNombre: row.campus_nombre,
        asignados: row.activos_asignados,
        noAsignados: 0,
        pctGlobal:
          kpis.activos.total > 0
            ? Number(
                ((row.activos_asignados * 100) / kpis.activos.total).toFixed(2),
              )
            : 0,
      })),
      {
        campusId: null,
        campusNombre: 'Sin asignar',
        asignados: 0,
        noAsignados: noAsignados,
        pctGlobal:
          kpis.activos.total > 0
            ? Number(((noAsignados * 100) / kpis.activos.total).toFixed(2))
            : 0,
      },
    ];

    const ambientesActivosInactivosPorCampus = rows.map((row) => ({
      campusId: row.campus_id,
      campusNombre: row.campus_nombre,
      activos: row.ambientes_activos,
      inactivos: row.ambientes_inactivos,
    }));

    const table = {
      campusResumen: rows.map((row) => ({
        campusId: row.campus_id,
        campusNombre: row.campus_nombre,
        facultades: row.facultades_total,
        bloques: row.bloques_total,
        tiposBloque: row.tipos_bloque,
        ambientes: row.ambientes_total,
        tiposAmbiente: row.tipos_ambiente,
        capacidadTotal: row.capacidad_total,
        capacidadExamen: row.capacidad_examen,
        activosAsignados: row.activos_asignados,
      })),
    };

    return {
      schemaVersion: 1,
      filtersApplied: { campusIds, includeInactive },
      layout: { mode: 'global' },
      data: {
        kpis,
        charts: {
          rankingAmbientesPorCampus,
          capacidadTotalPorCampus,
          capacidadExamenPorCampus,
          activosPorCampus,
          ambientesActivosInactivosPorCampus,
        },
        table,
      },
    };
  }

  // Obtiene el dashboard de detalle para un campus; devuelve null si no existe con los filtros dados.
  async getDetailDashboard(
    filters: DashboardDetailFilters,
  ): Promise<DashboardDetailResult | null> {
    const { campusId, includeInactive } = filters;

    const activeCampusFilter = includeInactive ? '' : 'AND c.activo = TRUE';

    // 1) Verificar existencia del campus con el filtro de activo.
    const campusRows: Array<{ id: number; nombre: string; activo: boolean }> =
      await this.dataSource.query(
        `
        SELECT c.id, c.nombre, c.activo
        FROM infraestructura.campus c
        WHERE c.id = $1
        ${activeCampusFilter}
      `,
        [campusId],
      );

    if (!campusRows.length) {
      return null;
    }
    const campus = campusRows[0];

    // 2) KPIs y sumatorias
    const summaryRows: Array<{
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
    }> = await this.dataSource.query(
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
        WHERE c.id = $1
        ${includeInactive ? '' : 'AND f.activo = TRUE AND b.activo = TRUE AND a.activo = TRUE'}
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

    // 3) Tipos de bloque (chart)
    const tiposBloqueRows: Array<{
      tipo_bloque_id: number;
      tipo_bloque_nombre: string;
      cantidad: number;
    }> = await this.dataSource.query(
      `
        SELECT
          tb.id AS tipo_bloque_id,
          tb.nombre AS tipo_bloque_nombre,
          COUNT(*)::int AS cantidad
        FROM infraestructura.bloques b
        INNER JOIN infraestructura.tipo_bloques tb ON tb.id = b.tipo_bloque_id
        INNER JOIN infraestructura.facultades f ON f.id = b.facultad_id
        WHERE f.campus_id = $1
        ${includeInactive ? '' : 'AND b.activo = TRUE'}
        GROUP BY tb.id, tb.nombre
        ORDER BY cantidad DESC
      `,
      [campusId],
    );

    // 4) Tipos de ambiente (chart)
    const tiposAmbienteRows: Array<{
      tipo_ambiente_id: number;
      tipo_ambiente_nombre: string;
      cantidad: number;
    }> = await this.dataSource.query(
      `
        SELECT
          ta.id AS tipo_ambiente_id,
          ta.nombre AS tipo_ambiente_nombre,
          COUNT(*)::int AS cantidad
        FROM infraestructura.ambientes a
        INNER JOIN infraestructura.tipo_ambientes ta ON ta.id = a.tipo_ambiente_id
        INNER JOIN infraestructura.bloques b ON b.id = a.bloque_id
        INNER JOIN infraestructura.facultades f ON f.id = b.facultad_id
        WHERE f.campus_id = $1
        ${includeInactive ? '' : 'AND a.activo = TRUE'}
        GROUP BY ta.id, ta.nombre
        ORDER BY cantidad DESC
      `,
      [campusId],
    );

    // 5) Tabla de facultades
    const facultadesRows: Array<{
      facultad_id: number;
      facultad_nombre: string;
      bloques: number;
      tipos_bloque: number;
      ambientes: number;
      tipos_ambiente: number;
      capacidad_total: number;
      capacidad_examen: number;
      activos_asignados: number;
    }> = await this.dataSource.query(
      `
        SELECT
          f.id AS facultad_id,
          f.nombre AS facultad_nombre,
          COUNT(DISTINCT b.id) AS bloques,
          COUNT(DISTINCT b.tipo_bloque_id) AS tipos_bloque,
          COUNT(DISTINCT a.id) AS ambientes,
          COUNT(DISTINCT a.tipo_ambiente_id) AS tipos_ambiente,
          COALESCE(SUM((a.capacidad->>'total')::int), 0) AS capacidad_total,
          COALESCE(SUM((a.capacidad->>'examen')::int), 0) AS capacidad_examen,
          COUNT(act.id) FILTER (WHERE act.id IS NOT NULL) AS activos_asignados
        FROM infraestructura.facultades f
        LEFT JOIN infraestructura.bloques b ON b.facultad_id = f.id
        LEFT JOIN infraestructura.ambientes a ON a.bloque_id = b.id
        LEFT JOIN infraestructura.activos act ON act.ambiente_id = a.id
        WHERE f.campus_id = $1
        ${includeInactive ? '' : 'AND f.activo = TRUE AND b.activo = TRUE AND a.activo = TRUE'}
        GROUP BY f.id, f.nombre
        ORDER BY f.nombre ASC
      `,
      [campusId],
    );

    // 6) Activos no asignados globales (para KPI/activos)
    const unassignedRows: Array<{ no_asignados: number }> =
      await this.dataSource.query(
        `
        SELECT COUNT(*)::int AS no_asignados
        FROM infraestructura.activos act
        WHERE act.ambiente_id IS NULL
      `,
      );
    const noAsignados = unassignedRows[0]?.no_asignados ?? 0;

    const result: DashboardDetailResult = {
      schemaVersion: 1,
      filtersApplied: { campusId, includeInactive },
      layout: { mode: 'detail' },
      data: {
        campus: {
          id: Number(campus.id),
          nombre: campus.nombre,
          activo: campus.activo,
        },
        kpis: {
          facultades: {
            activos: Number(summary.facultades_activos ?? 0),
            inactivos: Number(summary.facultades_inactivos ?? 0),
          },
          bloques: {
            activos: Number(summary.bloques_activos ?? 0),
            inactivos: Number(summary.bloques_inactivos ?? 0),
          },
          ambientes: {
            activos: Number(summary.ambientes_activos ?? 0),
            inactivos: Number(summary.ambientes_inactivos ?? 0),
          },
          capacidad: {
            total: Number(summary.capacidad_total ?? 0),
            examen: Number(summary.capacidad_examen ?? 0),
          },
          activos: {
            asignados: Number(summary.activos_asignados ?? 0),
            noAsignadosGlobal: noAsignados,
          },
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

    return result;
  }
}

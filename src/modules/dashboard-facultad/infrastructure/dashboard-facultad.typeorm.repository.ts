/* eslint-disable indent */
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DashboardFacultadRepositoryPort } from '../domain/dashboard-facultad.repository.port';
import {
  DashboardFacultadDetailFilters,
  DashboardFacultadDetailResult,
  DashboardFacultadGlobalFilters,
  DashboardFacultadGlobalResult,
} from '../domain/dashboard-facultad.types';

type GlobalAggregateRow = {
  facultad_id: number;
  facultad_nombre: string;
  facultad_nombre_corto: string | null;
  facultad_activo: boolean;
  campus_id: number;
  campus_nombre: string;
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

@Injectable()
export class DashboardFacultadTypeormRepository implements DashboardFacultadRepositoryPort {
  constructor(private readonly dataSource: DataSource) {}

  // Obtiene el dashboard global por facultad con KPIs agregados y estructura V2.
  async getGlobalDashboard(
    filters: DashboardFacultadGlobalFilters,
  ): Promise<DashboardFacultadGlobalResult> {
    const { campusIds, facultadIds, includeInactive, slotMinutes, dias } =
      filters;
    const diasFiltro = dias && dias.length > 0 ? dias : [0, 1, 2, 3, 4, 5, 6];

    const campusFilter =
      campusIds && campusIds.length > 0 ? 'AND f.campus_id = ANY($1)' : '';
    const facultadFilter =
      facultadIds && facultadIds.length > 0
        ? `AND f.id = ANY($${campusFilter ? 2 : 1})`
        : '';
    const activeFilter = includeInactive ? '' : 'AND f.activo = TRUE';
    const activeHierarchyFilter = includeInactive
      ? ''
      : 'AND (b.id IS NULL OR b.activo = TRUE) AND (a.id IS NULL OR a.activo = TRUE)';
    const activeBlockAndFacultyFilter = includeInactive
      ? ''
      : 'AND b.activo = TRUE AND f.activo = TRUE';
    const activeAmbienteBlockAndFacultyFilter = includeInactive
      ? ''
      : 'AND a.activo = TRUE AND b.activo = TRUE AND f.activo = TRUE';

    const params: unknown[] = [];
    if (campusFilter) {
      params.push(campusIds);
    }
    if (facultadFilter) {
      params.push(facultadIds);
    }

    const aggregatedRowsRaw: unknown[] = await this.dataSource.query(
      `
      SELECT
        f.id AS facultad_id,
        f.nombre AS facultad_nombre,
        f.nombre_corto AS facultad_nombre_corto,
        f.activo AS facultad_activo,
        c.id AS campus_id,
        c.nombre AS campus_nombre,
        COUNT(DISTINCT b.id) AS bloques_total,
        COUNT(DISTINCT b.id) FILTER (WHERE b.activo = TRUE) AS bloques_activos,
        COUNT(DISTINCT b.id) FILTER (WHERE b.activo = FALSE) AS bloques_inactivos,
        COUNT(DISTINCT a.id) AS ambientes_total,
        COUNT(DISTINCT a.id) FILTER (WHERE a.activo = TRUE) AS ambientes_activos,
        COUNT(DISTINCT a.id) FILTER (WHERE a.activo = FALSE) AS ambientes_inactivos,
        COALESCE(SUM((a.capacidad->>'total')::int), 0) AS capacidad_total,
        COALESCE(SUM((a.capacidad->>'examen')::int), 0) AS capacidad_examen,
        COUNT(act.id) FILTER (WHERE act.id IS NOT NULL) AS activos_asignados
      FROM infraestructura.facultades f
      INNER JOIN infraestructura.campus c ON c.id = f.campus_id
      LEFT JOIN infraestructura.bloques b ON b.facultad_id = f.id
      LEFT JOIN infraestructura.ambientes a ON a.bloque_id = b.id
      LEFT JOIN infraestructura.activos act ON act.ambiente_id = a.id
      WHERE 1=1
      ${campusFilter}
      ${facultadFilter}
      ${activeFilter}
      ${activeHierarchyFilter}
      GROUP BY f.id, f.nombre, f.nombre_corto, f.activo, c.id, c.nombre
      ORDER BY f.nombre ASC
    `,
      params,
    );

    const rows = (aggregatedRowsRaw as GlobalAggregateRow[]).map((row) => ({
      facultad_id: Number(row.facultad_id),
      facultad_nombre: row.facultad_nombre,
      facultad_nombre_corto: row.facultad_nombre_corto ?? null,
      facultad_activo: Boolean(row.facultad_activo),
      campus_id: Number(row.campus_id),
      campus_nombre: row.campus_nombre,
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

    const unassignedRows: Array<{ no_asignados: number }> =
      await this.dataSource.query(
        `
      SELECT COUNT(*)::int AS no_asignados
      FROM infraestructura.activos act
      WHERE act.ambiente_id IS NULL
    `,
      );
    const noAsignadosGlobal = Number(unassignedRows[0]?.no_asignados ?? 0);

    const kpis = {
      facultades: {
        activos: rows.filter((row) => row.facultad_activo).length,
        inactivos: rows.filter((row) => !row.facultad_activo).length,
      },
      bloques: {
        activos: rows.reduce((sum, row) => sum + row.bloques_activos, 0),
        inactivos: rows.reduce((sum, row) => sum + row.bloques_inactivos, 0),
      },
      ambientes: {
        activos: rows.reduce((sum, row) => sum + row.ambientes_activos, 0),
        inactivos: rows.reduce((sum, row) => sum + row.ambientes_inactivos, 0),
      },
      capacidad: {
        total: rows.reduce((sum, row) => sum + row.capacidad_total, 0),
        examen: rows.reduce((sum, row) => sum + row.capacidad_examen, 0),
      },
      activos: {
        asignados: rows.reduce((sum, row) => sum + row.activos_asignados, 0),
        noAsignadosGlobal,
      },
    };

    // 3) tiposBloque global.
    const tiposBloqueRows: Array<{
      tipo_bloque_id: number;
      tipo_bloque_nombre: string;
      cantidad: number;
    }> =
      (await this.dataSource.query(
        `
      SELECT
        tb.id AS tipo_bloque_id,
        tb.nombre AS tipo_bloque_nombre,
        COUNT(*)::int AS cantidad
      FROM infraestructura.bloques b
      INNER JOIN infraestructura.tipo_bloques tb ON tb.id = b.tipo_bloque_id
      INNER JOIN infraestructura.facultades f ON f.id = b.facultad_id
      WHERE 1=1
      ${campusFilter}
      ${facultadFilter}
      ${activeBlockAndFacultyFilter}
      GROUP BY tb.id, tb.nombre
      ORDER BY cantidad DESC
    `,
        params,
      )) ?? [];

    // 4) tiposAmbiente global.
    const tiposAmbienteRows: Array<{
      tipo_ambiente_id: number;
      tipo_ambiente_nombre: string;
      cantidad: number;
    }> =
      (await this.dataSource.query(
        `
      SELECT
        ta.id AS tipo_ambiente_id,
        ta.nombre AS tipo_ambiente_nombre,
        COUNT(*)::int AS cantidad
      FROM infraestructura.ambientes a
      INNER JOIN infraestructura.tipo_ambientes ta ON ta.id = a.tipo_ambiente_id
      INNER JOIN infraestructura.bloques b ON b.id = a.bloque_id
      INNER JOIN infraestructura.facultades f ON f.id = b.facultad_id
      WHERE 1=1
      ${campusFilter}
      ${facultadFilter}
      ${activeAmbienteBlockAndFacultyFilter}
      GROUP BY ta.id, ta.nombre
      ORDER BY cantidad DESC
    `,
        params,
      )) ?? [];

    // 5) capacidad por bloque global.
    const capacidadPorBloqueRows: Array<{
      bloque_id: number;
      bloque_nombre: string;
      capacidad_total: number;
      capacidad_examen: number;
    }> =
      (await this.dataSource.query(
        `
      SELECT
        b.id AS bloque_id,
        b.nombre AS bloque_nombre,
        COALESCE(SUM((a.capacidad->>'total')::int), 0) AS capacidad_total,
        COALESCE(SUM((a.capacidad->>'examen')::int), 0) AS capacidad_examen
      FROM infraestructura.bloques b
      LEFT JOIN infraestructura.ambientes a ON a.bloque_id = b.id
      INNER JOIN infraestructura.facultades f ON f.id = b.facultad_id
      WHERE 1=1
      ${campusFilter}
      ${facultadFilter}
      ${activeBlockAndFacultyFilter}
      GROUP BY b.id, b.nombre
      ORDER BY capacidad_total DESC
    `,
        params,
      )) ?? [];

    // 6) activos por bloque global.
    const activosPorBloqueRows: Array<{
      bloque_id: number;
      bloque_nombre: string;
      activos_asignados: number;
    }> =
      (await this.dataSource.query(
        `
      SELECT
        b.id AS bloque_id,
        b.nombre AS bloque_nombre,
        COUNT(act.id)::int AS activos_asignados
      FROM infraestructura.bloques b
      LEFT JOIN infraestructura.ambientes a ON a.bloque_id = b.id
      LEFT JOIN infraestructura.activos act ON act.ambiente_id = a.id
      INNER JOIN infraestructura.facultades f ON f.id = b.facultad_id
      WHERE 1=1
      ${campusFilter}
      ${facultadFilter}
      ${activeBlockAndFacultyFilter}
      GROUP BY b.id, b.nombre
      ORDER BY activos_asignados DESC
    `,
        params,
      )) ?? [];

    // 7) ambientes activos/inactivos por bloque global.
    const ambientesEstadoRows: Array<{
      bloque_id: number;
      bloque_nombre: string;
      activos: number;
      inactivos: number;
    }> =
      (await this.dataSource.query(
        `
      SELECT
        b.id AS bloque_id,
        b.nombre AS bloque_nombre,
        COUNT(a.id) FILTER (WHERE a.activo = TRUE) AS activos,
        COUNT(a.id) FILTER (WHERE a.activo = FALSE) AS inactivos
      FROM infraestructura.bloques b
      LEFT JOIN infraestructura.ambientes a ON a.bloque_id = b.id
      INNER JOIN infraestructura.facultades f ON f.id = b.facultad_id
      WHERE 1=1
      ${campusFilter}
      ${facultadFilter}
      ${activeBlockAndFacultyFilter}
      GROUP BY b.id, b.nombre
      ORDER BY b.nombre ASC
    `,
        params,
      )) ?? [];

    const slotMinutesParamIndex = params.length + 1;
    const diasParamIndex = params.length + 2;
    const occupancyParams = [...params, slotMinutes, diasFiltro];

    // 8) ocupacion heatmap semanal global.
    const heatmapRows: Array<{
      dia: number;
      franja: string;
      slots_ocupados: number;
      slots_totales: number;
      pct_ocupacion: number;
    }> =
      (await this.dataSource.query(
        `
      WITH scope_ambientes AS (
        SELECT
          a.id AS ambiente_id,
          a.hora_apertura,
          a.hora_cierre
        FROM infraestructura.ambientes a
        INNER JOIN infraestructura.bloques b ON b.id = a.bloque_id
        INNER JOIN infraestructura.facultades f ON f.id = b.facultad_id
        WHERE 1=1
        ${campusFilter}
        ${facultadFilter}
        ${
          includeInactive
            ? ''
            : 'AND f.activo = TRUE AND b.activo = TRUE AND a.activo = TRUE'
        }
          AND a.hora_apertura IS NOT NULL
          AND a.hora_cierre IS NOT NULL
          AND a.hora_apertura < a.hora_cierre
      ),
      dias_sel AS (
        SELECT unnest($${diasParamIndex}::int[]) AS dia
      ),
      slots AS (
        SELECT
          d.dia,
          sa.ambiente_id,
          gs AS slot_start,
          gs + make_interval(mins => $${slotMinutesParamIndex}) AS slot_end
        FROM scope_ambientes sa
        CROSS JOIN dias_sel d
        CROSS JOIN LATERAL generate_series(
          ('2000-01-01'::timestamp + sa.hora_apertura),
          ('2000-01-01'::timestamp + sa.hora_cierre) - make_interval(mins => $${slotMinutesParamIndex}),
          make_interval(mins => $${slotMinutesParamIndex})
        ) gs
      ),
      slots_marcados AS (
        SELECT
          s.*,
          EXISTS (
            SELECT 1
            FROM infraestructura.horarios h
            WHERE h.ambiente_id = s.ambiente_id
              AND h.dia = s.dia
              AND h.slot_range && tsrange(s.slot_start, s.slot_end, '[)')
          ) AS ocupado
        FROM slots s
      )
      SELECT
        sm.dia,
        to_char(sm.slot_start, 'HH24:MI') || '-' || to_char(sm.slot_end, 'HH24:MI') AS franja,
        COUNT(*) FILTER (WHERE sm.ocupado)::int AS slots_ocupados,
        COUNT(*)::int AS slots_totales,
        CASE
          WHEN COUNT(*) = 0 THEN 0
          ELSE ROUND(((COUNT(*) FILTER (WHERE sm.ocupado))::numeric * 100) / COUNT(*), 2)
        END AS pct_ocupacion
      FROM slots_marcados sm
      GROUP BY sm.dia, franja
      ORDER BY sm.dia ASC, franja ASC
    `,
        occupancyParams,
      )) ?? [];

    // 9) ocupacion por bloque global.
    const ocupacionPorBloqueRows: Array<{
      bloque_id: number;
      bloque_nombre: string;
      slots_ocupados: number;
      slots_totales: number;
      pct_ocupacion: number;
    }> =
      (await this.dataSource.query(
        `
      WITH scope_ambientes AS (
        SELECT
          a.id AS ambiente_id,
          b.id AS bloque_id,
          b.nombre AS bloque_nombre,
          a.hora_apertura,
          a.hora_cierre
        FROM infraestructura.ambientes a
        INNER JOIN infraestructura.bloques b ON b.id = a.bloque_id
        INNER JOIN infraestructura.facultades f ON f.id = b.facultad_id
        WHERE 1=1
        ${campusFilter}
        ${facultadFilter}
        ${
          includeInactive
            ? ''
            : 'AND f.activo = TRUE AND b.activo = TRUE AND a.activo = TRUE'
        }
          AND a.hora_apertura IS NOT NULL
          AND a.hora_cierre IS NOT NULL
          AND a.hora_apertura < a.hora_cierre
      ),
      dias_sel AS (
        SELECT unnest($${diasParamIndex}::int[]) AS dia
      ),
      slots AS (
        SELECT
          sa.bloque_id,
          sa.bloque_nombre,
          d.dia,
          sa.ambiente_id,
          gs AS slot_start,
          gs + make_interval(mins => $${slotMinutesParamIndex}) AS slot_end
        FROM scope_ambientes sa
        CROSS JOIN dias_sel d
        CROSS JOIN LATERAL generate_series(
          ('2000-01-01'::timestamp + sa.hora_apertura),
          ('2000-01-01'::timestamp + sa.hora_cierre) - make_interval(mins => $${slotMinutesParamIndex}),
          make_interval(mins => $${slotMinutesParamIndex})
        ) gs
      ),
      slots_marcados AS (
        SELECT
          s.*,
          EXISTS (
            SELECT 1
            FROM infraestructura.horarios h
            WHERE h.ambiente_id = s.ambiente_id
              AND h.dia = s.dia
              AND h.slot_range && tsrange(s.slot_start, s.slot_end, '[)')
          ) AS ocupado
        FROM slots s
      )
      SELECT
        sm.bloque_id,
        sm.bloque_nombre,
        COUNT(*) FILTER (WHERE sm.ocupado)::int AS slots_ocupados,
        COUNT(*)::int AS slots_totales,
        CASE
          WHEN COUNT(*) = 0 THEN 0
          ELSE ROUND(((COUNT(*) FILTER (WHERE sm.ocupado))::numeric * 100) / COUNT(*), 2)
        END AS pct_ocupacion
      FROM slots_marcados sm
      GROUP BY sm.bloque_id, sm.bloque_nombre
      ORDER BY pct_ocupacion DESC
    `,
        occupancyParams,
      )) ?? [];

    // 10) top sobrecargados global.
    const topSobrecargadosRows: Array<{
      ambiente_id: number;
      ambiente_nombre: string;
      pct_ocupacion: number;
      slots_ocupados: number;
      slots_totales: number;
    }> =
      (await this.dataSource.query(
        `
      WITH scope_ambientes AS (
        SELECT
          a.id AS ambiente_id,
          a.nombre AS ambiente_nombre,
          a.hora_apertura,
          a.hora_cierre
        FROM infraestructura.ambientes a
        INNER JOIN infraestructura.bloques b ON b.id = a.bloque_id
        INNER JOIN infraestructura.facultades f ON f.id = b.facultad_id
        WHERE 1=1
        ${campusFilter}
        ${facultadFilter}
        ${
          includeInactive
            ? ''
            : 'AND f.activo = TRUE AND b.activo = TRUE AND a.activo = TRUE'
        }
          AND a.hora_apertura IS NOT NULL
          AND a.hora_cierre IS NOT NULL
          AND a.hora_apertura < a.hora_cierre
      ),
      dias_sel AS (
        SELECT unnest($${diasParamIndex}::int[]) AS dia
      ),
      slots AS (
        SELECT
          sa.ambiente_id,
          sa.ambiente_nombre,
          d.dia,
          gs AS slot_start,
          gs + make_interval(mins => $${slotMinutesParamIndex}) AS slot_end
        FROM scope_ambientes sa
        CROSS JOIN dias_sel d
        CROSS JOIN LATERAL generate_series(
          ('2000-01-01'::timestamp + sa.hora_apertura),
          ('2000-01-01'::timestamp + sa.hora_cierre) - make_interval(mins => $${slotMinutesParamIndex}),
          make_interval(mins => $${slotMinutesParamIndex})
        ) gs
      ),
      slots_marcados AS (
        SELECT
          s.*,
          EXISTS (
            SELECT 1
            FROM infraestructura.horarios h
            WHERE h.ambiente_id = s.ambiente_id
              AND h.dia = s.dia
              AND h.slot_range && tsrange(s.slot_start, s.slot_end, '[)')
          ) AS ocupado
        FROM slots s
      )
      SELECT
        sm.ambiente_id,
        sm.ambiente_nombre,
        COUNT(*) FILTER (WHERE sm.ocupado)::int AS slots_ocupados,
        COUNT(*)::int AS slots_totales,
        CASE
          WHEN COUNT(*) = 0 THEN 0
          ELSE ROUND(((COUNT(*) FILTER (WHERE sm.ocupado))::numeric * 100) / COUNT(*), 2)
        END AS pct_ocupacion
      FROM slots_marcados sm
      GROUP BY sm.ambiente_id, sm.ambiente_nombre
      ORDER BY pct_ocupacion DESC, slots_ocupados DESC
      LIMIT 5
    `,
        occupancyParams,
      )) ?? [];

    // 11) top subutilizados global.
    const topSubutilizadosRows: Array<{
      ambiente_id: number;
      ambiente_nombre: string;
      pct_ocupacion: number;
      slots_ocupados: number;
      slots_totales: number;
    }> =
      (await this.dataSource.query(
        `
      WITH scope_ambientes AS (
        SELECT
          a.id AS ambiente_id,
          a.nombre AS ambiente_nombre,
          a.hora_apertura,
          a.hora_cierre
        FROM infraestructura.ambientes a
        INNER JOIN infraestructura.bloques b ON b.id = a.bloque_id
        INNER JOIN infraestructura.facultades f ON f.id = b.facultad_id
        WHERE 1=1
        ${campusFilter}
        ${facultadFilter}
        ${
          includeInactive
            ? ''
            : 'AND f.activo = TRUE AND b.activo = TRUE AND a.activo = TRUE'
        }
          AND a.hora_apertura IS NOT NULL
          AND a.hora_cierre IS NOT NULL
          AND a.hora_apertura < a.hora_cierre
      ),
      dias_sel AS (
        SELECT unnest($${diasParamIndex}::int[]) AS dia
      ),
      slots AS (
        SELECT
          sa.ambiente_id,
          sa.ambiente_nombre,
          d.dia,
          gs AS slot_start,
          gs + make_interval(mins => $${slotMinutesParamIndex}) AS slot_end
        FROM scope_ambientes sa
        CROSS JOIN dias_sel d
        CROSS JOIN LATERAL generate_series(
          ('2000-01-01'::timestamp + sa.hora_apertura),
          ('2000-01-01'::timestamp + sa.hora_cierre) - make_interval(mins => $${slotMinutesParamIndex}),
          make_interval(mins => $${slotMinutesParamIndex})
        ) gs
      ),
      slots_marcados AS (
        SELECT
          s.*,
          EXISTS (
            SELECT 1
            FROM infraestructura.horarios h
            WHERE h.ambiente_id = s.ambiente_id
              AND h.dia = s.dia
              AND h.slot_range && tsrange(s.slot_start, s.slot_end, '[)')
          ) AS ocupado
        FROM slots s
      )
      SELECT
        sm.ambiente_id,
        sm.ambiente_nombre,
        COUNT(*) FILTER (WHERE sm.ocupado)::int AS slots_ocupados,
        COUNT(*)::int AS slots_totales,
        CASE
          WHEN COUNT(*) = 0 THEN 0
          ELSE ROUND(((COUNT(*) FILTER (WHERE sm.ocupado))::numeric * 100) / COUNT(*), 2)
        END AS pct_ocupacion
      FROM slots_marcados sm
      GROUP BY sm.ambiente_id, sm.ambiente_nombre
      ORDER BY pct_ocupacion ASC, slots_ocupados ASC
      LIMIT 5
    `,
        occupancyParams,
      )) ?? [];

    // 12) tabla resumen de bloques global.
    const resumenBloquesRows: Array<{
      bloque_id: number;
      bloque_nombre: string;
      tipo_bloque_nombre: string;
      pisos: number;
      activo: boolean;
      ambientes: number;
      tipos_ambiente: number;
      capacidad_total: number;
      capacidad_examen: number;
      activos_asignados: number;
    }> =
      (await this.dataSource.query(
        `
      SELECT
        b.id AS bloque_id,
        b.nombre AS bloque_nombre,
        tb.nombre AS tipo_bloque_nombre,
        b.pisos,
        b.activo,
        COUNT(DISTINCT a.id) AS ambientes,
        COUNT(DISTINCT a.tipo_ambiente_id) AS tipos_ambiente,
        COALESCE(SUM((a.capacidad->>'total')::int), 0) AS capacidad_total,
        COALESCE(SUM((a.capacidad->>'examen')::int), 0) AS capacidad_examen,
        COUNT(act.id) FILTER (WHERE act.id IS NOT NULL) AS activos_asignados
      FROM infraestructura.bloques b
      INNER JOIN infraestructura.tipo_bloques tb ON tb.id = b.tipo_bloque_id
      LEFT JOIN infraestructura.ambientes a ON a.bloque_id = b.id
      LEFT JOIN infraestructura.activos act ON act.ambiente_id = a.id
      INNER JOIN infraestructura.facultades f ON f.id = b.facultad_id
      WHERE 1=1
      ${campusFilter}
      ${facultadFilter}
      GROUP BY b.id, b.nombre, tb.nombre, b.pisos, b.activo
      ORDER BY b.nombre ASC
    `,
        params,
      )) ?? [];

    // 13) tabla ambientes utilizacion global.
    const ambientesUtilizacionRows: Array<{
      ambiente_id: number;
      ambiente_nombre: string;
      bloque_nombre: string;
      slots_ocupados: number;
      slots_totales: number;
      pct_ocupacion: number;
    }> =
      (await this.dataSource.query(
        `
      WITH scope_ambientes AS (
        SELECT
          a.id AS ambiente_id,
          a.nombre AS ambiente_nombre,
          b.nombre AS bloque_nombre,
          a.hora_apertura,
          a.hora_cierre
        FROM infraestructura.ambientes a
        INNER JOIN infraestructura.bloques b ON b.id = a.bloque_id
        INNER JOIN infraestructura.facultades f ON f.id = b.facultad_id
        WHERE 1=1
        ${campusFilter}
        ${facultadFilter}
        ${
          includeInactive
            ? ''
            : 'AND f.activo = TRUE AND b.activo = TRUE AND a.activo = TRUE'
        }
          AND a.hora_apertura IS NOT NULL
          AND a.hora_cierre IS NOT NULL
          AND a.hora_apertura < a.hora_cierre
      ),
      dias_sel AS (
        SELECT unnest($${diasParamIndex}::int[]) AS dia
      ),
      slots AS (
        SELECT
          sa.ambiente_id,
          sa.ambiente_nombre,
          sa.bloque_nombre,
          d.dia,
          gs AS slot_start,
          gs + make_interval(mins => $${slotMinutesParamIndex}) AS slot_end
        FROM scope_ambientes sa
        CROSS JOIN dias_sel d
        CROSS JOIN LATERAL generate_series(
          ('2000-01-01'::timestamp + sa.hora_apertura),
          ('2000-01-01'::timestamp + sa.hora_cierre) - make_interval(mins => $${slotMinutesParamIndex}),
          make_interval(mins => $${slotMinutesParamIndex})
        ) gs
      ),
      slots_marcados AS (
        SELECT
          s.*,
          EXISTS (
            SELECT 1
            FROM infraestructura.horarios h
            WHERE h.ambiente_id = s.ambiente_id
              AND h.dia = s.dia
              AND h.slot_range && tsrange(s.slot_start, s.slot_end, '[)')
          ) AS ocupado
        FROM slots s
      )
      SELECT
        sm.ambiente_id,
        sm.ambiente_nombre,
        sm.bloque_nombre,
        COUNT(*) FILTER (WHERE sm.ocupado)::int AS slots_ocupados,
        COUNT(*)::int AS slots_totales,
        CASE
          WHEN COUNT(*) = 0 THEN 0
          ELSE ROUND(((COUNT(*) FILTER (WHERE sm.ocupado))::numeric * 100) / COUNT(*), 2)
        END AS pct_ocupacion
      FROM slots_marcados sm
      GROUP BY sm.ambiente_id, sm.ambiente_nombre, sm.bloque_nombre
      ORDER BY pct_ocupacion DESC
    `,
        occupancyParams,
      )) ?? [];

    return {
      schemaVersion: 2,
      filtersApplied: {
        campusIds,
        facultadIds,
        includeInactive,
        slotMinutes,
        dias,
      },
      layout: { mode: 'global' },
      data: {
        kpis,
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
          capacidadPorBloque: capacidadPorBloqueRows.map((row) => ({
            bloqueId: Number(row.bloque_id),
            bloqueNombre: row.bloque_nombre,
            capacidadTotal: Number(row.capacidad_total ?? 0),
            capacidadExamen: Number(row.capacidad_examen ?? 0),
          })),
          activosPorBloque: activosPorBloqueRows.map((row) => ({
            bloqueId: Number(row.bloque_id),
            bloqueNombre: row.bloque_nombre,
            activosAsignados: Number(row.activos_asignados ?? 0),
          })),
          ambientesActivosInactivosPorBloque: ambientesEstadoRows.map(
            (row) => ({
              bloqueId: Number(row.bloque_id),
              bloqueNombre: row.bloque_nombre,
              activos: Number(row.activos ?? 0),
              inactivos: Number(row.inactivos ?? 0),
            }),
          ),
          ocupacionHeatmapSemanal: heatmapRows.map((row) => ({
            dia: Number(row.dia),
            franja: row.franja,
            slotsOcupados: Number(row.slots_ocupados ?? 0),
            slotsTotales: Number(row.slots_totales ?? 0),
            pctOcupacion: Number(row.pct_ocupacion ?? 0),
          })),
          ocupacionPorBloque: ocupacionPorBloqueRows.map((row) => ({
            bloqueId: Number(row.bloque_id),
            bloqueNombre: row.bloque_nombre,
            slotsOcupados: Number(row.slots_ocupados ?? 0),
            slotsTotales: Number(row.slots_totales ?? 0),
            pctOcupacion: Number(row.pct_ocupacion ?? 0),
          })),
          topAmbientesUtilizacion: {
            sobrecargados: topSobrecargadosRows.map((row) => ({
              ambienteId: Number(row.ambiente_id),
              ambienteNombre: row.ambiente_nombre,
              pctOcupacion: Number(row.pct_ocupacion ?? 0),
              slotsOcupados: Number(row.slots_ocupados ?? 0),
              slotsTotales: Number(row.slots_totales ?? 0),
            })),
            subutilizados: topSubutilizadosRows.map((row) => ({
              ambienteId: Number(row.ambiente_id),
              ambienteNombre: row.ambiente_nombre,
              pctOcupacion: Number(row.pct_ocupacion ?? 0),
              slotsOcupados: Number(row.slots_ocupados ?? 0),
              slotsTotales: Number(row.slots_totales ?? 0),
            })),
          },
        },
        tables: {
          resumenBloques: resumenBloquesRows.map((row) => ({
            bloqueId: Number(row.bloque_id),
            bloqueNombre: row.bloque_nombre,
            tipoBloqueNombre: row.tipo_bloque_nombre,
            pisos: Number(row.pisos ?? 0),
            activo: Boolean(row.activo),
            ambientes: Number(row.ambientes ?? 0),
            tiposAmbiente: Number(row.tipos_ambiente ?? 0),
            capacidadTotal: Number(row.capacidad_total ?? 0),
            capacidadExamen: Number(row.capacidad_examen ?? 0),
            activosAsignados: Number(row.activos_asignados ?? 0),
          })),
          ambientesUtilizacion: ambientesUtilizacionRows.map((row) => ({
            ambienteId: Number(row.ambiente_id),
            ambienteNombre: row.ambiente_nombre,
            bloqueNombre: row.bloque_nombre,
            slotsOcupados: Number(row.slots_ocupados ?? 0),
            slotsTotales: Number(row.slots_totales ?? 0),
            pctOcupacion: Number(row.pct_ocupacion ?? 0),
          })),
        },
      },
    };
  }

  // Obtiene el dashboard detalle por facultad; retorna null si no existe la facultad.
  async getDetailDashboard(
    filters: DashboardFacultadDetailFilters,
  ): Promise<DashboardFacultadDetailResult | null> {
    const { facultadId, includeInactive, slotMinutes, dias } = filters;
    const diasFiltro = dias && dias.length > 0 ? dias : [0, 1, 2, 3, 4, 5, 6];
    const activeFilter = includeInactive ? '' : 'AND f.activo = TRUE';
    const activeHierarchyFilter = includeInactive
      ? ''
      : 'AND (b.id IS NULL OR b.activo = TRUE) AND (a.id IS NULL OR a.activo = TRUE)';
    const activeBloqueFilter = includeInactive ? '' : 'AND b.activo = TRUE';
    const activeAmbienteFilter = includeInactive ? '' : 'AND a.activo = TRUE';
    const activeBloqueAmbienteFilter = includeInactive
      ? ''
      : 'AND b.activo = TRUE AND a.activo = TRUE';

    // 1) Facultad base.
    const facultadRows: Array<{
      id: number;
      nombre: string;
      nombre_corto: string | null;
      activo: boolean;
      campus_id: number;
      campus_nombre: string;
    }> = await this.dataSource.query(
      `
      SELECT
        f.id,
        f.nombre,
        f.nombre_corto,
        f.activo,
        c.id AS campus_id,
        c.nombre AS campus_nombre
      FROM infraestructura.facultades f
      INNER JOIN infraestructura.campus c ON c.id = f.campus_id
      WHERE f.id = $1
      ${activeFilter}
    `,
      [facultadId],
    );

    if (!facultadRows.length) {
      return null;
    }
    const facultad = facultadRows[0];

    // 2) KPI resumen de facultad.
    const summaryRows: Array<{
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
        COUNT(DISTINCT b.id) AS bloques_total,
        COUNT(DISTINCT b.id) FILTER (WHERE b.activo = TRUE) AS bloques_activos,
        COUNT(DISTINCT b.id) FILTER (WHERE b.activo = FALSE) AS bloques_inactivos,
        COUNT(DISTINCT a.id) AS ambientes_total,
        COUNT(DISTINCT a.id) FILTER (WHERE a.activo = TRUE) AS ambientes_activos,
        COUNT(DISTINCT a.id) FILTER (WHERE a.activo = FALSE) AS ambientes_inactivos,
        COALESCE(SUM((a.capacidad->>'total')::int), 0) AS capacidad_total,
        COALESCE(SUM((a.capacidad->>'examen')::int), 0) AS capacidad_examen,
        COUNT(act.id) FILTER (WHERE act.id IS NOT NULL) AS activos_asignados
      FROM infraestructura.facultades f
      LEFT JOIN infraestructura.bloques b ON b.facultad_id = f.id
      LEFT JOIN infraestructura.ambientes a ON a.bloque_id = b.id
      LEFT JOIN infraestructura.activos act ON act.ambiente_id = a.id
      WHERE f.id = $1
      ${activeHierarchyFilter}
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

    // 3) tiposBloque.
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
      WHERE b.facultad_id = $1
      ${activeBloqueFilter}
      GROUP BY tb.id, tb.nombre
      ORDER BY cantidad DESC
    `,
      [facultadId],
    );

    // 4) tiposAmbiente.
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
      WHERE b.facultad_id = $1
      ${activeAmbienteFilter}
      GROUP BY ta.id, ta.nombre
      ORDER BY cantidad DESC
    `,
      [facultadId],
    );

    // 5) capacidadPorBloque.
    const capacidadPorBloqueRows: Array<{
      bloque_id: number;
      bloque_nombre: string;
      capacidad_total: number;
      capacidad_examen: number;
    }> = await this.dataSource.query(
      `
      SELECT
        b.id AS bloque_id,
        b.nombre AS bloque_nombre,
        COALESCE(SUM((a.capacidad->>'total')::int), 0) AS capacidad_total,
        COALESCE(SUM((a.capacidad->>'examen')::int), 0) AS capacidad_examen
      FROM infraestructura.bloques b
      LEFT JOIN infraestructura.ambientes a ON a.bloque_id = b.id
      WHERE b.facultad_id = $1
      GROUP BY b.id, b.nombre
      ORDER BY capacidad_total DESC
    `,
      [facultadId],
    );

    // 6) activosPorBloque.
    const activosPorBloqueRows: Array<{
      bloque_id: number;
      bloque_nombre: string;
      activos_asignados: number;
    }> = await this.dataSource.query(
      `
      SELECT
        b.id AS bloque_id,
        b.nombre AS bloque_nombre,
        COUNT(act.id)::int AS activos_asignados
      FROM infraestructura.bloques b
      LEFT JOIN infraestructura.ambientes a ON a.bloque_id = b.id
      LEFT JOIN infraestructura.activos act ON act.ambiente_id = a.id
      WHERE b.facultad_id = $1
      GROUP BY b.id, b.nombre
      ORDER BY activos_asignados DESC
    `,
      [facultadId],
    );

    // 7) ambientesActivosInactivosPorBloque.
    const ambientesEstadoRows: Array<{
      bloque_id: number;
      bloque_nombre: string;
      activos: number;
      inactivos: number;
    }> = await this.dataSource.query(
      `
      SELECT
        b.id AS bloque_id,
        b.nombre AS bloque_nombre,
        COUNT(a.id) FILTER (WHERE a.activo = TRUE) AS activos,
        COUNT(a.id) FILTER (WHERE a.activo = FALSE) AS inactivos
      FROM infraestructura.bloques b
      LEFT JOIN infraestructura.ambientes a ON a.bloque_id = b.id
      WHERE b.facultad_id = $1
      GROUP BY b.id, b.nombre
      ORDER BY b.nombre ASC
    `,
      [facultadId],
    );

    const slotMinutesDetailParamIndex = 2;
    const diasDetailParamIndex = 3;
    const occupancyDetailParams = [facultadId, slotMinutes, diasFiltro];

    // 8) ocupacionHeatmapSemanal.
    const heatmapRows: Array<{
      dia: number;
      franja: string;
      slots_ocupados: number;
      slots_totales: number;
      pct_ocupacion: number;
    }> = await this.dataSource.query(
      `
      WITH scope_ambientes AS (
        SELECT
          a.id AS ambiente_id,
          a.hora_apertura,
          a.hora_cierre
        FROM infraestructura.ambientes a
        INNER JOIN infraestructura.bloques b ON b.id = a.bloque_id
        WHERE b.facultad_id = $1
        ${activeBloqueAmbienteFilter}
          AND a.hora_apertura IS NOT NULL
          AND a.hora_cierre IS NOT NULL
          AND a.hora_apertura < a.hora_cierre
      ),
      dias_sel AS (
        SELECT unnest($${diasDetailParamIndex}::int[]) AS dia
      ),
      slots AS (
        SELECT
          d.dia,
          sa.ambiente_id,
          gs AS slot_start,
          gs + make_interval(mins => $${slotMinutesDetailParamIndex}) AS slot_end
        FROM scope_ambientes sa
        CROSS JOIN dias_sel d
        CROSS JOIN LATERAL generate_series(
          ('2000-01-01'::timestamp + sa.hora_apertura),
          ('2000-01-01'::timestamp + sa.hora_cierre) - make_interval(mins => $${slotMinutesDetailParamIndex}),
          make_interval(mins => $${slotMinutesDetailParamIndex})
        ) gs
      ),
      slots_marcados AS (
        SELECT
          s.*,
          EXISTS (
            SELECT 1
            FROM infraestructura.horarios h
            WHERE h.ambiente_id = s.ambiente_id
              AND h.dia = s.dia
              AND h.slot_range && tsrange(s.slot_start, s.slot_end, '[)')
          ) AS ocupado
        FROM slots s
      )
      SELECT
        sm.dia,
        to_char(sm.slot_start, 'HH24:MI') || '-' || to_char(sm.slot_end, 'HH24:MI') AS franja,
        COUNT(*) FILTER (WHERE sm.ocupado)::int AS slots_ocupados,
        COUNT(*)::int AS slots_totales,
        CASE
          WHEN COUNT(*) = 0 THEN 0
          ELSE ROUND(((COUNT(*) FILTER (WHERE sm.ocupado))::numeric * 100) / COUNT(*), 2)
        END AS pct_ocupacion
      FROM slots_marcados sm
      GROUP BY sm.dia, franja
      ORDER BY sm.dia ASC, franja ASC
    `,
      occupancyDetailParams,
    );

    // 9) ocupacionPorBloque.
    const ocupacionPorBloqueRows: Array<{
      bloque_id: number;
      bloque_nombre: string;
      slots_ocupados: number;
      slots_totales: number;
      pct_ocupacion: number;
    }> = await this.dataSource.query(
      `
      WITH scope_ambientes AS (
        SELECT
          a.id AS ambiente_id,
          b.id AS bloque_id,
          b.nombre AS bloque_nombre,
          a.hora_apertura,
          a.hora_cierre
        FROM infraestructura.ambientes a
        INNER JOIN infraestructura.bloques b ON b.id = a.bloque_id
        WHERE b.facultad_id = $1
        ${activeBloqueAmbienteFilter}
          AND a.hora_apertura IS NOT NULL
          AND a.hora_cierre IS NOT NULL
          AND a.hora_apertura < a.hora_cierre
      ),
      dias_sel AS (
        SELECT unnest($${diasDetailParamIndex}::int[]) AS dia
      ),
      slots AS (
        SELECT
          sa.bloque_id,
          sa.bloque_nombre,
          d.dia,
          sa.ambiente_id,
          gs AS slot_start,
          gs + make_interval(mins => $${slotMinutesDetailParamIndex}) AS slot_end
        FROM scope_ambientes sa
        CROSS JOIN dias_sel d
        CROSS JOIN LATERAL generate_series(
          ('2000-01-01'::timestamp + sa.hora_apertura),
          ('2000-01-01'::timestamp + sa.hora_cierre) - make_interval(mins => $${slotMinutesDetailParamIndex}),
          make_interval(mins => $${slotMinutesDetailParamIndex})
        ) gs
      ),
      slots_marcados AS (
        SELECT
          s.*,
          EXISTS (
            SELECT 1
            FROM infraestructura.horarios h
            WHERE h.ambiente_id = s.ambiente_id
              AND h.dia = s.dia
              AND h.slot_range && tsrange(s.slot_start, s.slot_end, '[)')
          ) AS ocupado
        FROM slots s
      )
      SELECT
        sm.bloque_id,
        sm.bloque_nombre,
        COUNT(*) FILTER (WHERE sm.ocupado)::int AS slots_ocupados,
        COUNT(*)::int AS slots_totales,
        CASE
          WHEN COUNT(*) = 0 THEN 0
          ELSE ROUND(((COUNT(*) FILTER (WHERE sm.ocupado))::numeric * 100) / COUNT(*), 2)
        END AS pct_ocupacion
      FROM slots_marcados sm
      GROUP BY sm.bloque_id, sm.bloque_nombre
      ORDER BY pct_ocupacion DESC
    `,
      occupancyDetailParams,
    );

    // 10) top sobrecargados.
    const topSobrecargadosRows: Array<{
      ambiente_id: number;
      ambiente_nombre: string;
      pct_ocupacion: number;
      slots_ocupados: number;
      slots_totales: number;
    }> = await this.dataSource.query(
      `
      WITH scope_ambientes AS (
        SELECT
          a.id AS ambiente_id,
          a.nombre AS ambiente_nombre,
          a.hora_apertura,
          a.hora_cierre
        FROM infraestructura.ambientes a
        INNER JOIN infraestructura.bloques b ON b.id = a.bloque_id
        WHERE b.facultad_id = $1
        ${activeBloqueAmbienteFilter}
          AND a.hora_apertura IS NOT NULL
          AND a.hora_cierre IS NOT NULL
          AND a.hora_apertura < a.hora_cierre
      ),
      dias_sel AS (
        SELECT unnest($${diasDetailParamIndex}::int[]) AS dia
      ),
      slots AS (
        SELECT
          sa.ambiente_id,
          sa.ambiente_nombre,
          d.dia,
          gs AS slot_start,
          gs + make_interval(mins => $${slotMinutesDetailParamIndex}) AS slot_end
        FROM scope_ambientes sa
        CROSS JOIN dias_sel d
        CROSS JOIN LATERAL generate_series(
          ('2000-01-01'::timestamp + sa.hora_apertura),
          ('2000-01-01'::timestamp + sa.hora_cierre) - make_interval(mins => $${slotMinutesDetailParamIndex}),
          make_interval(mins => $${slotMinutesDetailParamIndex})
        ) gs
      ),
      slots_marcados AS (
        SELECT
          s.*,
          EXISTS (
            SELECT 1
            FROM infraestructura.horarios h
            WHERE h.ambiente_id = s.ambiente_id
              AND h.dia = s.dia
              AND h.slot_range && tsrange(s.slot_start, s.slot_end, '[)')
          ) AS ocupado
        FROM slots s
      )
      SELECT
        sm.ambiente_id,
        sm.ambiente_nombre,
        COUNT(*) FILTER (WHERE sm.ocupado)::int AS slots_ocupados,
        COUNT(*)::int AS slots_totales,
        CASE
          WHEN COUNT(*) = 0 THEN 0
          ELSE ROUND(((COUNT(*) FILTER (WHERE sm.ocupado))::numeric * 100) / COUNT(*), 2)
        END AS pct_ocupacion
      FROM slots_marcados sm
      GROUP BY sm.ambiente_id, sm.ambiente_nombre
      ORDER BY pct_ocupacion DESC, slots_ocupados DESC
      LIMIT 5
    `,
      occupancyDetailParams,
    );

    // 11) top subutilizados.
    const topSubutilizadosRows: Array<{
      ambiente_id: number;
      ambiente_nombre: string;
      pct_ocupacion: number;
      slots_ocupados: number;
      slots_totales: number;
    }> = await this.dataSource.query(
      `
      WITH scope_ambientes AS (
        SELECT
          a.id AS ambiente_id,
          a.nombre AS ambiente_nombre,
          a.hora_apertura,
          a.hora_cierre
        FROM infraestructura.ambientes a
        INNER JOIN infraestructura.bloques b ON b.id = a.bloque_id
        WHERE b.facultad_id = $1
        ${activeBloqueAmbienteFilter}
          AND a.hora_apertura IS NOT NULL
          AND a.hora_cierre IS NOT NULL
          AND a.hora_apertura < a.hora_cierre
      ),
      dias_sel AS (
        SELECT unnest($${diasDetailParamIndex}::int[]) AS dia
      ),
      slots AS (
        SELECT
          sa.ambiente_id,
          sa.ambiente_nombre,
          d.dia,
          gs AS slot_start,
          gs + make_interval(mins => $${slotMinutesDetailParamIndex}) AS slot_end
        FROM scope_ambientes sa
        CROSS JOIN dias_sel d
        CROSS JOIN LATERAL generate_series(
          ('2000-01-01'::timestamp + sa.hora_apertura),
          ('2000-01-01'::timestamp + sa.hora_cierre) - make_interval(mins => $${slotMinutesDetailParamIndex}),
          make_interval(mins => $${slotMinutesDetailParamIndex})
        ) gs
      ),
      slots_marcados AS (
        SELECT
          s.*,
          EXISTS (
            SELECT 1
            FROM infraestructura.horarios h
            WHERE h.ambiente_id = s.ambiente_id
              AND h.dia = s.dia
              AND h.slot_range && tsrange(s.slot_start, s.slot_end, '[)')
          ) AS ocupado
        FROM slots s
      )
      SELECT
        sm.ambiente_id,
        sm.ambiente_nombre,
        COUNT(*) FILTER (WHERE sm.ocupado)::int AS slots_ocupados,
        COUNT(*)::int AS slots_totales,
        CASE
          WHEN COUNT(*) = 0 THEN 0
          ELSE ROUND(((COUNT(*) FILTER (WHERE sm.ocupado))::numeric * 100) / COUNT(*), 2)
        END AS pct_ocupacion
      FROM slots_marcados sm
      GROUP BY sm.ambiente_id, sm.ambiente_nombre
      ORDER BY pct_ocupacion ASC, slots_ocupados ASC
      LIMIT 5
    `,
      occupancyDetailParams,
    );

    // 12) resumenBloques.
    const resumenBloquesRows: Array<{
      bloque_id: number;
      bloque_nombre: string;
      tipo_bloque_nombre: string;
      pisos: number;
      activo: boolean;
      ambientes: number;
      tipos_ambiente: number;
      capacidad_total: number;
      capacidad_examen: number;
      activos_asignados: number;
    }> = await this.dataSource.query(
      `
      SELECT
        b.id AS bloque_id,
        b.nombre AS bloque_nombre,
        tb.nombre AS tipo_bloque_nombre,
        b.pisos,
        b.activo,
        COUNT(DISTINCT a.id) AS ambientes,
        COUNT(DISTINCT a.tipo_ambiente_id) AS tipos_ambiente,
        COALESCE(SUM((a.capacidad->>'total')::int), 0) AS capacidad_total,
        COALESCE(SUM((a.capacidad->>'examen')::int), 0) AS capacidad_examen,
        COUNT(act.id) FILTER (WHERE act.id IS NOT NULL) AS activos_asignados
      FROM infraestructura.bloques b
      INNER JOIN infraestructura.tipo_bloques tb ON tb.id = b.tipo_bloque_id
      LEFT JOIN infraestructura.ambientes a ON a.bloque_id = b.id
      LEFT JOIN infraestructura.activos act ON act.ambiente_id = a.id
      WHERE b.facultad_id = $1
      GROUP BY b.id, b.nombre, tb.nombre, b.pisos, b.activo
      ORDER BY b.nombre ASC
    `,
      [facultadId],
    );

    // 13) ambientesUtilizacion.
    const ambientesUtilizacionRows: Array<{
      ambiente_id: number;
      ambiente_nombre: string;
      bloque_nombre: string;
      slots_ocupados: number;
      slots_totales: number;
      pct_ocupacion: number;
    }> = await this.dataSource.query(
      `
      WITH scope_ambientes AS (
        SELECT
          a.id AS ambiente_id,
          a.nombre AS ambiente_nombre,
          b.nombre AS bloque_nombre,
          a.hora_apertura,
          a.hora_cierre
        FROM infraestructura.ambientes a
        INNER JOIN infraestructura.bloques b ON b.id = a.bloque_id
        WHERE b.facultad_id = $1
        ${activeBloqueAmbienteFilter}
          AND a.hora_apertura IS NOT NULL
          AND a.hora_cierre IS NOT NULL
          AND a.hora_apertura < a.hora_cierre
      ),
      dias_sel AS (
        SELECT unnest($${diasDetailParamIndex}::int[]) AS dia
      ),
      slots AS (
        SELECT
          sa.ambiente_id,
          sa.ambiente_nombre,
          sa.bloque_nombre,
          d.dia,
          gs AS slot_start,
          gs + make_interval(mins => $${slotMinutesDetailParamIndex}) AS slot_end
        FROM scope_ambientes sa
        CROSS JOIN dias_sel d
        CROSS JOIN LATERAL generate_series(
          ('2000-01-01'::timestamp + sa.hora_apertura),
          ('2000-01-01'::timestamp + sa.hora_cierre) - make_interval(mins => $${slotMinutesDetailParamIndex}),
          make_interval(mins => $${slotMinutesDetailParamIndex})
        ) gs
      ),
      slots_marcados AS (
        SELECT
          s.*,
          EXISTS (
            SELECT 1
            FROM infraestructura.horarios h
            WHERE h.ambiente_id = s.ambiente_id
              AND h.dia = s.dia
              AND h.slot_range && tsrange(s.slot_start, s.slot_end, '[)')
          ) AS ocupado
        FROM slots s
      )
      SELECT
        sm.ambiente_id,
        sm.ambiente_nombre,
        sm.bloque_nombre,
        COUNT(*) FILTER (WHERE sm.ocupado)::int AS slots_ocupados,
        COUNT(*)::int AS slots_totales,
        CASE
          WHEN COUNT(*) = 0 THEN 0
          ELSE ROUND(((COUNT(*) FILTER (WHERE sm.ocupado))::numeric * 100) / COUNT(*), 2)
        END AS pct_ocupacion
      FROM slots_marcados sm
      GROUP BY sm.ambiente_id, sm.ambiente_nombre, sm.bloque_nombre
      ORDER BY pct_ocupacion DESC
    `,
      occupancyDetailParams,
    );

    // 14) activos no asignados global.
    const unassignedRows: Array<{ no_asignados: number }> =
      await this.dataSource.query(
        `
      SELECT COUNT(*)::int AS no_asignados
      FROM infraestructura.activos act
      WHERE act.ambiente_id IS NULL
    `,
      );
    const noAsignadosGlobal = Number(unassignedRows[0]?.no_asignados ?? 0);

    return {
      schemaVersion: 2,
      filtersApplied: { facultadId, includeInactive, slotMinutes, dias },
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
          facultades: {
            activos: facultad.activo ? 1 : 0,
            inactivos: facultad.activo ? 0 : 1,
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
            noAsignadosGlobal,
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
          capacidadPorBloque: capacidadPorBloqueRows.map((row) => ({
            bloqueId: Number(row.bloque_id),
            bloqueNombre: row.bloque_nombre,
            capacidadTotal: Number(row.capacidad_total ?? 0),
            capacidadExamen: Number(row.capacidad_examen ?? 0),
          })),
          activosPorBloque: activosPorBloqueRows.map((row) => ({
            bloqueId: Number(row.bloque_id),
            bloqueNombre: row.bloque_nombre,
            activosAsignados: Number(row.activos_asignados ?? 0),
          })),
          ambientesActivosInactivosPorBloque: ambientesEstadoRows.map(
            (row) => ({
              bloqueId: Number(row.bloque_id),
              bloqueNombre: row.bloque_nombre,
              activos: Number(row.activos ?? 0),
              inactivos: Number(row.inactivos ?? 0),
            }),
          ),
          ocupacionHeatmapSemanal: heatmapRows.map((row) => ({
            dia: Number(row.dia),
            franja: row.franja,
            slotsOcupados: Number(row.slots_ocupados ?? 0),
            slotsTotales: Number(row.slots_totales ?? 0),
            pctOcupacion: Number(row.pct_ocupacion ?? 0),
          })),
          ocupacionPorBloque: ocupacionPorBloqueRows.map((row) => ({
            bloqueId: Number(row.bloque_id),
            bloqueNombre: row.bloque_nombre,
            slotsOcupados: Number(row.slots_ocupados ?? 0),
            slotsTotales: Number(row.slots_totales ?? 0),
            pctOcupacion: Number(row.pct_ocupacion ?? 0),
          })),
          topAmbientesUtilizacion: {
            sobrecargados: topSobrecargadosRows.map((row) => ({
              ambienteId: Number(row.ambiente_id),
              ambienteNombre: row.ambiente_nombre,
              pctOcupacion: Number(row.pct_ocupacion ?? 0),
              slotsOcupados: Number(row.slots_ocupados ?? 0),
              slotsTotales: Number(row.slots_totales ?? 0),
            })),
            subutilizados: topSubutilizadosRows.map((row) => ({
              ambienteId: Number(row.ambiente_id),
              ambienteNombre: row.ambiente_nombre,
              pctOcupacion: Number(row.pct_ocupacion ?? 0),
              slotsOcupados: Number(row.slots_ocupados ?? 0),
              slotsTotales: Number(row.slots_totales ?? 0),
            })),
          },
        },
        tables: {
          resumenBloques: resumenBloquesRows.map((row) => ({
            bloqueId: Number(row.bloque_id),
            bloqueNombre: row.bloque_nombre,
            tipoBloqueNombre: row.tipo_bloque_nombre,
            pisos: Number(row.pisos ?? 0),
            activo: Boolean(row.activo),
            ambientes: Number(row.ambientes ?? 0),
            tiposAmbiente: Number(row.tipos_ambiente ?? 0),
            capacidadTotal: Number(row.capacidad_total ?? 0),
            capacidadExamen: Number(row.capacidad_examen ?? 0),
            activosAsignados: Number(row.activos_asignados ?? 0),
          })),
          ambientesUtilizacion: ambientesUtilizacionRows.map((row) => ({
            ambienteId: Number(row.ambiente_id),
            ambienteNombre: row.ambiente_nombre,
            bloqueNombre: row.bloque_nombre,
            slotsOcupados: Number(row.slots_ocupados ?? 0),
            slotsTotales: Number(row.slots_totales ?? 0),
            pctOcupacion: Number(row.pct_ocupacion ?? 0),
          })),
        },
      },
    };
  }
}

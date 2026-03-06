/* eslint-disable indent */
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DashboardBloqueRepositoryPort } from '../domain/dashboard-bloque.repository.port';
import {
  DashboardBloqueGlobalFilters,
  DashboardBloqueGlobalResult,
} from '../domain/dashboard-bloque.types';

type GlobalAggregateRow = {
  campus_id: number;
  campus_nombre: string;
  campus_activo: boolean;
  facultad_id: number;
  facultad_nombre: string;
  facultad_activo: boolean;
  bloque_id: number;
  bloque_nombre: string;
  bloque_activo: boolean;
  ambientes_activos: number;
  ambientes_inactivos: number;
  capacidad_total: number;
  capacidad_examen: number;
  activos_asignados: number;
};

@Injectable()
export class DashboardBloqueTypeormRepository implements DashboardBloqueRepositoryPort {
  constructor(private readonly dataSource: DataSource) {}

  async getGlobalDashboard(
    filters: DashboardBloqueGlobalFilters,
  ): Promise<DashboardBloqueGlobalResult> {
    const {
      campusIds,
      facultadIds,
      bloqueIds,
      tipoBloqueIds,
      includeInactive,
      slotMinutes,
      dias,
    } = filters;
    const diasFiltro = dias && dias.length > 0 ? dias : [0, 1, 2, 3, 4, 5, 6];

    const params: unknown[] = [];
    const baseConditions: string[] = ['1=1'];

    if (campusIds && campusIds.length > 0) {
      params.push(campusIds);
      baseConditions.push(`c.id = ANY($${params.length})`);
    }

    if (facultadIds && facultadIds.length > 0) {
      params.push(facultadIds);
      baseConditions.push(`f.id = ANY($${params.length})`);
    }

    if (bloqueIds && bloqueIds.length > 0) {
      params.push(bloqueIds);
      baseConditions.push(`b.id = ANY($${params.length})`);
    }

    if (tipoBloqueIds && tipoBloqueIds.length > 0) {
      params.push(tipoBloqueIds);
      baseConditions.push(`b.tipo_bloque_id = ANY($${params.length})`);
    }

    const activeHierarchyFilter = includeInactive
      ? ''
      : 'AND c.activo = TRUE AND f.activo = TRUE AND b.activo = TRUE';
    const activeWithAmbienteFilter = includeInactive
      ? ''
      : 'AND c.activo = TRUE AND f.activo = TRUE AND b.activo = TRUE AND a.activo = TRUE';

    const aggregatedRowsRaw: unknown[] = await this.dataSource.query(
      `
      SELECT
        c.id AS campus_id,
        c.nombre AS campus_nombre,
        c.activo AS campus_activo,
        f.id AS facultad_id,
        f.nombre AS facultad_nombre,
        f.activo AS facultad_activo,
        b.id AS bloque_id,
        b.nombre AS bloque_nombre,
        b.activo AS bloque_activo,
        COUNT(DISTINCT a.id) FILTER (WHERE a.activo = TRUE) AS ambientes_activos,
        COUNT(DISTINCT a.id) FILTER (WHERE a.activo = FALSE) AS ambientes_inactivos,
        COALESCE(SUM((a.capacidad->>'total')::int), 0) AS capacidad_total,
        COALESCE(SUM((a.capacidad->>'examen')::int), 0) AS capacidad_examen,
        COUNT(act.id) FILTER (WHERE act.id IS NOT NULL) AS activos_asignados
      FROM infraestructura.bloques b
      INNER JOIN infraestructura.facultades f ON f.id = b.facultad_id
      INNER JOIN infraestructura.campus c ON c.id = f.campus_id
      LEFT JOIN infraestructura.ambientes a ON a.bloque_id = b.id
      LEFT JOIN infraestructura.activos act ON act.ambiente_id = a.id
      WHERE ${baseConditions.join(' AND ')}
      ${activeHierarchyFilter}
      GROUP BY c.id, c.nombre, c.activo, f.id, f.nombre, f.activo, b.id, b.nombre, b.activo
      ORDER BY b.nombre ASC
    `,
      params,
    );

    const rows = (aggregatedRowsRaw as GlobalAggregateRow[]).map((row) => ({
      campus_id: Number(row.campus_id),
      campus_nombre: row.campus_nombre,
      campus_activo: Boolean(row.campus_activo),
      facultad_id: Number(row.facultad_id),
      facultad_nombre: row.facultad_nombre,
      facultad_activo: Boolean(row.facultad_activo),
      bloque_id: Number(row.bloque_id),
      bloque_nombre: row.bloque_nombre,
      bloque_activo: Boolean(row.bloque_activo),
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
      INNER JOIN infraestructura.campus c ON c.id = f.campus_id
      WHERE ${baseConditions.join(' AND ')}
      ${activeHierarchyFilter}
      GROUP BY tb.id, tb.nombre
      ORDER BY cantidad DESC
    `,
        params,
      )) ?? [];

    const ambientesPorBloqueRows: Array<{
      bloque_id: number;
      bloque_nombre: string;
      ambientes: number;
    }> =
      (await this.dataSource.query(
        `
      SELECT
        b.id AS bloque_id,
        b.nombre AS bloque_nombre,
        COUNT(a.id)::int AS ambientes
      FROM infraestructura.bloques b
      LEFT JOIN infraestructura.ambientes a ON a.bloque_id = b.id
      INNER JOIN infraestructura.facultades f ON f.id = b.facultad_id
      INNER JOIN infraestructura.campus c ON c.id = f.campus_id
      WHERE ${baseConditions.join(' AND ')}
      ${activeHierarchyFilter}
      GROUP BY b.id, b.nombre
      ORDER BY ambientes DESC
    `,
        params,
      )) ?? [];

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
      INNER JOIN infraestructura.campus c ON c.id = f.campus_id
      WHERE ${baseConditions.join(' AND ')}
      ${activeHierarchyFilter}
      GROUP BY b.id, b.nombre
      ORDER BY capacidad_total DESC
    `,
        params,
      )) ?? [];

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
      INNER JOIN infraestructura.campus c ON c.id = f.campus_id
      WHERE ${baseConditions.join(' AND ')}
      ${activeHierarchyFilter}
      GROUP BY b.id, b.nombre
      ORDER BY activos_asignados DESC
    `,
        params,
      )) ?? [];

    const slotMinutesParamIndex = params.length + 1;
    const diasParamIndex = params.length + 2;
    const occupancyParams = [...params, slotMinutes, diasFiltro];

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
        INNER JOIN infraestructura.campus c ON c.id = f.campus_id
        WHERE ${baseConditions.join(' AND ')}
        ${activeWithAmbienteFilter}
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
        INNER JOIN infraestructura.campus c ON c.id = f.campus_id
        WHERE ${baseConditions.join(' AND ')}
        ${activeWithAmbienteFilter}
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

    const topBloquesHighRows: Array<{
      bloque_id: number;
      bloque_nombre: string;
      pct_ocupacion: number;
      slots_ocupados: number;
      slots_totales: number;
    }> =
      (await this.dataSource.query(
        `
      SELECT
        opb.bloque_id,
        opb.bloque_nombre,
        opb.pct_ocupacion,
        opb.slots_ocupados,
        opb.slots_totales
      FROM (
        ${this.buildOcupacionPorBloqueSubquery(
          baseConditions.join(' AND '),
          activeWithAmbienteFilter,
          slotMinutesParamIndex,
          diasParamIndex,
        )}
      ) opb
      ORDER BY opb.pct_ocupacion DESC, opb.slots_ocupados DESC
      LIMIT 10
    `,
        occupancyParams,
      )) ?? [];

    const topBloquesLowRows: Array<{
      bloque_id: number;
      bloque_nombre: string;
      pct_ocupacion: number;
      slots_ocupados: number;
      slots_totales: number;
    }> =
      (await this.dataSource.query(
        `
      SELECT
        opb.bloque_id,
        opb.bloque_nombre,
        opb.pct_ocupacion,
        opb.slots_ocupados,
        opb.slots_totales
      FROM (
        ${this.buildOcupacionPorBloqueSubquery(
          baseConditions.join(' AND '),
          activeWithAmbienteFilter,
          slotMinutesParamIndex,
          diasParamIndex,
        )}
      ) opb
      ORDER BY opb.pct_ocupacion ASC, opb.slots_ocupados ASC
      LIMIT 10
    `,
        occupancyParams,
      )) ?? [];

    const topPisosHighRows: Array<{
      bloque_id: number;
      bloque_nombre: string;
      piso: number;
      pct_ocupacion: number;
      slots_ocupados: number;
      slots_totales: number;
    }> =
      (await this.dataSource.query(
        `
      SELECT
        opp.bloque_id,
        opp.bloque_nombre,
        opp.piso,
        opp.pct_ocupacion,
        opp.slots_ocupados,
        opp.slots_totales
      FROM (
        ${this.buildOcupacionPorPisoSubquery(
          baseConditions.join(' AND '),
          activeWithAmbienteFilter,
          slotMinutesParamIndex,
          diasParamIndex,
        )}
      ) opp
      ORDER BY opp.pct_ocupacion DESC, opp.slots_ocupados DESC
      LIMIT 10
    `,
        occupancyParams,
      )) ?? [];

    const topPisosLowRows: Array<{
      bloque_id: number;
      bloque_nombre: string;
      piso: number;
      pct_ocupacion: number;
      slots_ocupados: number;
      slots_totales: number;
    }> =
      (await this.dataSource.query(
        `
      SELECT
        opp.bloque_id,
        opp.bloque_nombre,
        opp.piso,
        opp.pct_ocupacion,
        opp.slots_ocupados,
        opp.slots_totales
      FROM (
        ${this.buildOcupacionPorPisoSubquery(
          baseConditions.join(' AND '),
          activeWithAmbienteFilter,
          slotMinutesParamIndex,
          diasParamIndex,
        )}
      ) opp
      ORDER BY opp.pct_ocupacion ASC, opp.slots_ocupados ASC
      LIMIT 10
    `,
        occupancyParams,
      )) ?? [];

    const resumenBloquesRows: Array<{
      bloque_id: number;
      bloque_nombre: string;
      campus_nombre: string;
      facultad_nombre: string;
      tipo_bloque_nombre: string;
      pisos: number;
      activo: boolean;
      ambientes: number;
      capacidad_total: number;
      capacidad_examen: number;
      activos_asignados: number;
      slots_ocupados: number;
      slots_totales: number;
      pct_ocupacion: number;
    }> =
      (await this.dataSource.query(
        `
      SELECT
        b.id AS bloque_id,
        b.nombre AS bloque_nombre,
        c.nombre AS campus_nombre,
        f.nombre AS facultad_nombre,
        tb.nombre AS tipo_bloque_nombre,
        b.pisos,
        b.activo,
        COUNT(DISTINCT a.id)::int AS ambientes,
        COALESCE(SUM((a.capacidad->>'total')::int), 0) AS capacidad_total,
        COALESCE(SUM((a.capacidad->>'examen')::int), 0) AS capacidad_examen,
        COUNT(act.id)::int AS activos_asignados,
        COALESCE(opb.slots_ocupados, 0)::int AS slots_ocupados,
        COALESCE(opb.slots_totales, 0)::int AS slots_totales,
        COALESCE(opb.pct_ocupacion, 0) AS pct_ocupacion
      FROM infraestructura.bloques b
      INNER JOIN infraestructura.tipo_bloques tb ON tb.id = b.tipo_bloque_id
      INNER JOIN infraestructura.facultades f ON f.id = b.facultad_id
      INNER JOIN infraestructura.campus c ON c.id = f.campus_id
      LEFT JOIN infraestructura.ambientes a ON a.bloque_id = b.id
      LEFT JOIN infraestructura.activos act ON act.ambiente_id = a.id
      LEFT JOIN (
        ${this.buildOcupacionPorBloqueSubquery(
          baseConditions.join(' AND '),
          activeWithAmbienteFilter,
          slotMinutesParamIndex,
          diasParamIndex,
        )}
      ) opb ON opb.bloque_id = b.id
      WHERE ${baseConditions.join(' AND ')}
      ${activeHierarchyFilter}
      GROUP BY b.id, b.nombre, c.nombre, f.nombre, tb.nombre, b.pisos, b.activo, opb.slots_ocupados, opb.slots_totales, opb.pct_ocupacion
      ORDER BY b.nombre ASC
    `,
        occupancyParams,
      )) ?? [];

    const pisosUtilizacionRows: Array<{
      bloque_id: number;
      bloque_nombre: string;
      piso: number;
      ambientes: number;
      capacidad_total: number;
      capacidad_examen: number;
      activos_asignados: number;
      slots_ocupados: number;
      slots_totales: number;
      pct_ocupacion: number;
    }> =
      (await this.dataSource.query(
        `
      WITH ocupacion_piso AS (
        ${this.buildOcupacionPorPisoSubquery(
          baseConditions.join(' AND '),
          activeWithAmbienteFilter,
          slotMinutesParamIndex,
          diasParamIndex,
        )}
      )
      SELECT
        b.id AS bloque_id,
        b.nombre AS bloque_nombre,
        a.piso,
        COUNT(DISTINCT a.id)::int AS ambientes,
        COALESCE(SUM((a.capacidad->>'total')::int), 0) AS capacidad_total,
        COALESCE(SUM((a.capacidad->>'examen')::int), 0) AS capacidad_examen,
        COUNT(act.id)::int AS activos_asignados,
        COALESCE(op.slots_ocupados, 0)::int AS slots_ocupados,
        COALESCE(op.slots_totales, 0)::int AS slots_totales,
        COALESCE(op.pct_ocupacion, 0) AS pct_ocupacion
      FROM infraestructura.ambientes a
      INNER JOIN infraestructura.bloques b ON b.id = a.bloque_id
      INNER JOIN infraestructura.facultades f ON f.id = b.facultad_id
      INNER JOIN infraestructura.campus c ON c.id = f.campus_id
      LEFT JOIN infraestructura.activos act ON act.ambiente_id = a.id
      LEFT JOIN ocupacion_piso op ON op.bloque_id = b.id AND op.piso = a.piso
      WHERE ${baseConditions.join(' AND ')}
      ${activeWithAmbienteFilter}
      GROUP BY b.id, b.nombre, a.piso, op.slots_ocupados, op.slots_totales, op.pct_ocupacion
      ORDER BY b.nombre ASC, a.piso ASC
    `,
        occupancyParams,
      )) ?? [];

    const campusMap = new Map<number, boolean>();
    const facultadMap = new Map<number, boolean>();
    rows.forEach((row) => {
      campusMap.set(row.campus_id, row.campus_activo);
      facultadMap.set(row.facultad_id, row.facultad_activo);
    });

    const kpis = {
      campus: {
        activos: [...campusMap.values()].filter(Boolean).length,
        inactivos: [...campusMap.values()].filter((value) => !value).length,
      },
      facultades: {
        activos: [...facultadMap.values()].filter(Boolean).length,
        inactivos: [...facultadMap.values()].filter((value) => !value).length,
      },
      bloques: {
        activos: rows.filter((row) => row.bloque_activo).length,
        inactivos: rows.filter((row) => !row.bloque_activo).length,
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
      ocupacion: {
        pctPromedioGlobal:
          ocupacionPorBloqueRows.length > 0
            ? Number(
                (
                  ocupacionPorBloqueRows.reduce(
                    (sum, row) => sum + Number(row.pct_ocupacion ?? 0),
                    0,
                  ) / ocupacionPorBloqueRows.length
                ).toFixed(2),
              )
            : 0,
      },
    };

    return {
      schemaVersion: 2,
      filtersApplied: {
        ...filters,
        dias: diasFiltro,
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
          ambientesPorBloque: ambientesPorBloqueRows.map((row) => ({
            bloqueId: Number(row.bloque_id),
            bloqueNombre: row.bloque_nombre,
            ambientes: Number(row.ambientes ?? 0),
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
          topBloquesUtilizacion: {
            sobrecargadosTop10: topBloquesHighRows.map((row) => ({
              bloqueId: Number(row.bloque_id),
              bloqueNombre: row.bloque_nombre,
              pctOcupacion: Number(row.pct_ocupacion ?? 0),
              slotsOcupados: Number(row.slots_ocupados ?? 0),
              slotsTotales: Number(row.slots_totales ?? 0),
            })),
            subutilizadosTop10: topBloquesLowRows.map((row) => ({
              bloqueId: Number(row.bloque_id),
              bloqueNombre: row.bloque_nombre,
              pctOcupacion: Number(row.pct_ocupacion ?? 0),
              slotsOcupados: Number(row.slots_ocupados ?? 0),
              slotsTotales: Number(row.slots_totales ?? 0),
            })),
          },
          topPisosUtilizacion: {
            sobrecargadosTop10: topPisosHighRows.map((row) => ({
              bloqueId: Number(row.bloque_id),
              bloqueNombre: row.bloque_nombre,
              piso: Number(row.piso ?? 0),
              pctOcupacion: Number(row.pct_ocupacion ?? 0),
              slotsOcupados: Number(row.slots_ocupados ?? 0),
              slotsTotales: Number(row.slots_totales ?? 0),
            })),
            subutilizadosTop10: topPisosLowRows.map((row) => ({
              bloqueId: Number(row.bloque_id),
              bloqueNombre: row.bloque_nombre,
              piso: Number(row.piso ?? 0),
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
            campusNombre: row.campus_nombre,
            facultadNombre: row.facultad_nombre,
            tipoBloqueNombre: row.tipo_bloque_nombre,
            pisos: Number(row.pisos ?? 0),
            activo: Boolean(row.activo),
            ambientes: Number(row.ambientes ?? 0),
            capacidadTotal: Number(row.capacidad_total ?? 0),
            capacidadExamen: Number(row.capacidad_examen ?? 0),
            activosAsignados: Number(row.activos_asignados ?? 0),
            slotsOcupados: Number(row.slots_ocupados ?? 0),
            slotsTotales: Number(row.slots_totales ?? 0),
            pctOcupacion: Number(row.pct_ocupacion ?? 0),
          })),
          pisosUtilizacion: pisosUtilizacionRows.map((row) => ({
            bloqueId: Number(row.bloque_id),
            bloqueNombre: row.bloque_nombre,
            piso: Number(row.piso ?? 0),
            ambientes: Number(row.ambientes ?? 0),
            capacidadTotal: Number(row.capacidad_total ?? 0),
            capacidadExamen: Number(row.capacidad_examen ?? 0),
            activosAsignados: Number(row.activos_asignados ?? 0),
            slotsOcupados: Number(row.slots_ocupados ?? 0),
            slotsTotales: Number(row.slots_totales ?? 0),
            pctOcupacion: Number(row.pct_ocupacion ?? 0),
          })),
        },
      },
    };
  }

  private buildOcupacionPorBloqueSubquery(
    baseConditions: string,
    activeWithAmbienteFilter: string,
    slotMinutesParamIndex: number,
    diasParamIndex: number,
  ): string {
    return `
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
        INNER JOIN infraestructura.campus c ON c.id = f.campus_id
        WHERE ${baseConditions}
        ${activeWithAmbienteFilter}
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
    `;
  }

  private buildOcupacionPorPisoSubquery(
    baseConditions: string,
    activeWithAmbienteFilter: string,
    slotMinutesParamIndex: number,
    diasParamIndex: number,
  ): string {
    return `
      WITH scope_ambientes AS (
        SELECT
          a.id AS ambiente_id,
          b.id AS bloque_id,
          b.nombre AS bloque_nombre,
          a.piso,
          a.hora_apertura,
          a.hora_cierre
        FROM infraestructura.ambientes a
        INNER JOIN infraestructura.bloques b ON b.id = a.bloque_id
        INNER JOIN infraestructura.facultades f ON f.id = b.facultad_id
        INNER JOIN infraestructura.campus c ON c.id = f.campus_id
        WHERE ${baseConditions}
        ${activeWithAmbienteFilter}
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
          sa.piso,
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
        sm.piso,
        COUNT(*) FILTER (WHERE sm.ocupado)::int AS slots_ocupados,
        COUNT(*)::int AS slots_totales,
        CASE
          WHEN COUNT(*) = 0 THEN 0
          ELSE ROUND(((COUNT(*) FILTER (WHERE sm.ocupado))::numeric * 100) / COUNT(*), 2)
        END AS pct_ocupacion
      FROM slots_marcados sm
      GROUP BY sm.bloque_id, sm.bloque_nombre, sm.piso
    `;
  }
}

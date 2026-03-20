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
    } = filters;

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
        COUNT(act.id)::int AS activos_asignados
      FROM infraestructura.bloques b
      INNER JOIN infraestructura.tipo_bloques tb ON tb.id = b.tipo_bloque_id
      INNER JOIN infraestructura.facultades f ON f.id = b.facultad_id
      INNER JOIN infraestructura.campus c ON c.id = f.campus_id
      LEFT JOIN infraestructura.ambientes a ON a.bloque_id = b.id
      LEFT JOIN infraestructura.activos act ON act.ambiente_id = a.id
      WHERE ${baseConditions.join(' AND ')}
      ${activeHierarchyFilter}
      GROUP BY b.id, b.nombre, c.nombre, f.nombre, tb.nombre, b.pisos, b.activo
      ORDER BY b.nombre ASC
    `,
        params,
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
    };

    return {
      schemaVersion: 2,
      filtersApplied: {
        ...filters,
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
          })),
        },
      },
    };
  }
}

import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type {
  AmbienteView,
  BloqueView,
  CampusView,
  FacultadView,
  InventarioReporteViewModel,
  KpiResumen,
} from '../../domain/models/inventario.view-model';
import type { InventarioReporteRepository } from '../../domain/ports/inventario-reporte.repository';
import { ReporteScope } from '../../interface/dto/generar-reporte-inventario.dto';

type CampusRow = {
  id: number;
  codigo: string;
  nombre: string;
  direccion: string;
  activo: boolean;
};

type FacultadRow = {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
  campus_id?: number;
};

type BloqueRow = {
  id: number;
  codigo: string;
  nombre: string;
  pisos: number;
  activo: boolean;
  facultad_id: number;
  tipo_bloque: string;
};

type DimensionJson = {
  largo?: number;
  ancho?: number;
  alto?: number;
  unid_med?: string;
};

type AmbienteRow = {
  id: number;
  codigo: string;
  nombre: string;
  piso: number;
  capacidad: { total?: number; examen?: number } | null;
  dimension?: DimensionJson | null;
  clases: boolean;
  activo: boolean;
  bloque_id: number;
  tipo_ambiente: string;
  activos_count: number;
};

/**
 * Repositorio de reportes de inventario con SQL crudo.
 * Construye un view-model jerárquico (campus -> facultades -> bloques -> ambientes)
 * con KPIs agregadas por nivel.
 */
@Injectable()
export class InventarioReporteRepositoryAdapter implements InventarioReporteRepository {
  constructor(@Inject(DataSource) private readonly dataSource: DataSource) {}

  async obtener_por_campus(
    campus_id: number,
  ): Promise<InventarioReporteViewModel | null> {
    const campusHeader = await this.findCampusHeader(campus_id);
    if (!campusHeader) {
      return null;
    }

    const facultades = await this.findFacultades(campusHeader.id);
    const bloques = await this.findBloquesByFacultades(
      facultades.map((f) => f.id),
    );
    const ambientes = await this.findAmbientesByBloques(
      bloques.map((b) => b.id),
    );

    const bloquesByFacultad = this.groupBy(bloques, (b) => b.facultad_id);
    const ambientesByBloque = this.groupBy(ambientes, (a) => a.bloque_id);

    const facultadesView: FacultadView[] = facultades.map((f) => {
      const bloquesFac = bloquesByFacultad[f.id] ?? [];
      const bloquesView: BloqueView[] = bloquesFac.map((b) => {
        const ambientesBloque = ambientesByBloque[b.id] ?? [];
        const kpisBloque = this.buildAmbientesKpis(ambientesBloque);
        return {
          id: b.id,
          codigo: b.codigo,
          nombre: b.nombre,
          tipo_bloque: b.tipo_bloque,
          pisos: b.pisos,
          estado: b.activo ? 'activo' : 'inactivo',
          kpis: kpisBloque,
          ambientes: ambientesBloque.map((a) => this.mapAmbiente(a)),
        };
      });

      const kpisFac = this.buildBloquesKpis(bloquesView);
      return {
        id: f.id,
        codigo: f.codigo,
        nombre: f.nombre,
        estado: f.activo ? 'activo' : 'inactivo',
        kpis: kpisFac,
        bloques: bloquesView,
      };
    });

    const kpisCampus = this.buildFacultadesKpis(facultadesView);

    const campusView: CampusView = {
      id: campusHeader.id,
      codigo: campusHeader.codigo,
      nombre: campusHeader.nombre,
      direccion: campusHeader.direccion,
      estado: campusHeader.activo ? 'activo' : 'inactivo',
      kpis: kpisCampus,
      facultades: facultadesView,
    };

    return { scope: ReporteScope.CAMPUS, campus: campusView };
  }

  async obtener_por_facultad(
    facultad_id: number,
  ): Promise<InventarioReporteViewModel | null> {
    const facultadHeader = await this.findFacultadHeader(facultad_id);
    if (!facultadHeader) {
      return null;
    }

    const bloques = await this.findBloquesByFacultades([facultadHeader.id]);
    const ambientes = await this.findAmbientesByBloques(
      bloques.map((b) => b.id),
    );
    const ambientesByBloque = this.groupBy(ambientes, (a) => a.bloque_id);

    const bloquesView: BloqueView[] = bloques.map((b) => {
      const ambientesBloque = ambientesByBloque[b.id] ?? [];
      const kpisBloque = this.buildAmbientesKpis(ambientesBloque);
      return {
        id: b.id,
        codigo: b.codigo,
        nombre: b.nombre,
        tipo_bloque: b.tipo_bloque,
        pisos: b.pisos,
        estado: b.activo ? 'activo' : 'inactivo',
        kpis: kpisBloque,
        ambientes: ambientesBloque.map((a) => this.mapAmbiente(a)),
      };
    });

    const kpisFac = this.buildBloquesKpis(bloquesView);

    const facultadView: FacultadView = {
      id: facultadHeader.id,
      codigo: facultadHeader.codigo,
      nombre: facultadHeader.nombre,
      estado: facultadHeader.activo ? 'activo' : 'inactivo',
      kpis: kpisFac,
      bloques: bloquesView,
    };

    return { scope: ReporteScope.FACULTAD, facultad: facultadView };
  }

  async obtener_por_bloque(
    bloque_id: number,
  ): Promise<InventarioReporteViewModel | null> {
    const bloqueHeader = await this.findBloqueHeader(bloque_id);
    if (!bloqueHeader) {
      return null;
    }

    const ambientes = await this.findAmbientesByBloques([bloqueHeader.id]);
    const kpisBloque = this.buildAmbientesKpis(ambientes);

    const bloqueView: BloqueView = {
      id: bloqueHeader.id,
      codigo: bloqueHeader.codigo,
      nombre: bloqueHeader.nombre,
      tipo_bloque: bloqueHeader.tipo_bloque,
      pisos: bloqueHeader.pisos,
      estado: bloqueHeader.activo ? 'activo' : 'inactivo',
      kpis: kpisBloque,
      ambientes: ambientes.map((a) => this.mapAmbiente(a)),
    };

    return { scope: ReporteScope.BLOQUE, bloque: bloqueView };
  }

  // -------------------------
  // Helpers de consulta
  // -------------------------
  private async findCampusHeader(
    campus_id: number,
  ): Promise<CampusRow | undefined> {
    const result: unknown[] = await this.dataSource.query(
      `
      SELECT id, codigo, nombre, direccion, activo
      FROM infraestructura.campus
      WHERE id = $1
      LIMIT 1;
    `,
      [campus_id],
    );
    const row = result[0] as CampusRow | undefined;
    return row;
  }

  private async findFacultadHeader(
    facultad_id: number,
  ): Promise<FacultadRow | undefined> {
    const result: unknown[] = await this.dataSource.query(
      `
      SELECT id, codigo, nombre, activo
      FROM infraestructura.facultades
      WHERE id = $1
      LIMIT 1;
    `,
      [facultad_id],
    );
    const row = result[0] as FacultadRow | undefined;
    return row;
  }

  private async findBloqueHeader(
    bloque_id: number,
  ): Promise<BloqueRow | undefined> {
    const result: unknown[] = await this.dataSource.query(
      `
      SELECT b.id,
             b.codigo,
             b.nombre,
             b.pisos,
             b.activo,
             tb.nombre AS tipo_bloque
      FROM infraestructura.bloques b
      JOIN infraestructura.tipo_bloques tb ON tb.id = b.tipo_bloque_id
      WHERE b.id = $1
      LIMIT 1;
    `,
      [bloque_id],
    );
    const row = result[0] as BloqueRow | undefined;
    return row;
  }

  private async findFacultades(campus_id: number): Promise<FacultadRow[]> {
    const result: unknown[] = await this.dataSource.query(
      `
      SELECT f.id,
             f.codigo,
             f.nombre,
             f.activo
      FROM infraestructura.facultades f
      WHERE f.campus_id = $1
      ORDER BY f.id;
    `,
      [campus_id],
    );
    return result as FacultadRow[];
  }

  private async findBloquesByFacultades(
    facultadIds: number[],
  ): Promise<BloqueRow[]> {
    if (!facultadIds.length) return [];
    const result: unknown[] = await this.dataSource.query(
      `
      SELECT b.id,
             b.codigo,
             b.nombre,
             b.pisos,
             b.activo,
             b.facultad_id,
             tb.nombre AS tipo_bloque
      FROM infraestructura.bloques b
      JOIN infraestructura.tipo_bloques tb ON tb.id = b.tipo_bloque_id
      WHERE b.facultad_id = ANY($1::int[])
      ORDER BY b.facultad_id, b.id;
    `,
      [facultadIds],
    );
    return result as BloqueRow[];
  }

  private async findAmbientesByBloques(
    bloqueIds: number[],
  ): Promise<AmbienteRow[]> {
    if (!bloqueIds.length) return [];
    const result: unknown[] = await this.dataSource.query(
      `
      SELECT a.id,
             a.codigo,
             a.nombre,
             a.piso,
             a.capacidad,
             a.dimension,
             a.clases,
             a.activo,
             a.bloque_id,
             ta.nombre AS tipo_ambiente,
             COALESCE(activos_cnt.total_activos, 0) AS activos_count
      FROM infraestructura.ambientes a
      JOIN infraestructura.tipo_ambientes ta ON ta.id = a.tipo_ambiente_id
      LEFT JOIN (
        SELECT ambiente_id, COUNT(*) AS total_activos
        FROM infraestructura.activos
        GROUP BY ambiente_id
      ) AS activos_cnt ON activos_cnt.ambiente_id = a.id
      WHERE a.bloque_id = ANY($1::int[])
      ORDER BY a.bloque_id, a.id;
    `,
      [bloqueIds],
    );
    return result as AmbienteRow[];
  }

  // -------------------------
  // Helpers de agregación / mapeo
  // -------------------------
  private mapAmbiente(a: AmbienteRow): AmbienteView {
    const capacidad = a.capacidad || { total: 0, examen: 0 };

    // dimension viene como jsonb: { largo, ancho, alto, unid_med }
    let dimensiones: string | undefined;
    if (a.dimension) {
      const { largo, ancho, alto, unid_med } = a.dimension;
      const hasAny =
        (largo ?? 0) !== 0 || (ancho ?? 0) !== 0 || (alto ?? 0) !== 0;
      if (hasAny) {
        const base = `${largo ?? 0}x${ancho ?? 0}x${alto ?? 0}`;
        dimensiones = unid_med ? `${base} ${unid_med}` : base;
      }
    }

    return {
      id: a.id,
      codigo: a.codigo,
      nombre: a.nombre,
      piso: a.piso,
      tipo_ambiente: a.tipo_ambiente,
      capacidad: {
        total: capacidad.total ?? 0,
        examen: capacidad.examen ?? 0,
      },
      dimensiones,
      clases: a.clases,
      estado: a.activo ? 'activo' : 'inactivo',
      activos_count: Number(a.activos_count ?? 0),
    };
  }

  private buildAmbientesKpis(ambientes: AmbienteRow[]): KpiResumen {
    const kpis: KpiResumen = {
      total_ambientes: ambientes.length,
      ambientes_activos: 0,
      ambientes_inactivos: 0,
      total_tipos_ambiente: 0,
      tipos_ambiente: {},
      capacidad: { total: 0, examen: 0 },
      activos_asociados: 0,
    };
    const tipoMap: Record<string, number> = {};
    for (const amb of ambientes) {
      const active = !!amb.activo;
      if (active) kpis.ambientes_activos!++;
      else kpis.ambientes_inactivos!++;
      const tipo = amb.tipo_ambiente || 'N/A';
      tipoMap[tipo] = (tipoMap[tipo] ?? 0) + 1;
      const cap = amb.capacidad || { total: 0, examen: 0 };
      kpis.capacidad!.total += cap.total ?? 0;
      kpis.capacidad!.examen += cap.examen ?? 0;
      kpis.activos_asociados! += Number(amb.activos_count ?? 0);
    }
    kpis.tipos_ambiente = tipoMap;
    kpis.total_tipos_ambiente = Object.keys(tipoMap).length;
    return kpis;
  }

  private buildBloquesKpis(bloques: BloqueView[]): KpiResumen {
    const kpis: KpiResumen = {
      total_bloques: bloques.length,
      bloques_activos: 0,
      bloques_inactivos: 0,
      total_tipos_bloque: 0,
      tipos_bloque: {},
      total_ambientes: 0,
      ambientes_activos: 0,
      ambientes_inactivos: 0,
      total_tipos_ambiente: 0,
      tipos_ambiente: {},
      capacidad: { total: 0, examen: 0 },
      activos_asociados: 0,
    };
    const tipoBloqueMap: Record<string, number> = {};
    const tipoAmbMap: Record<string, number> = {};

    for (const b of bloques) {
      if (b.estado === 'activo') kpis.bloques_activos!++;
      else kpis.bloques_inactivos!++;
      const tipo = b.tipo_bloque || 'N/A';
      tipoBloqueMap[tipo] = (tipoBloqueMap[tipo] ?? 0) + 1;

      kpis.total_ambientes! += b.ambientes.length;
      for (const amb of b.ambientes) {
        if (amb.estado === 'activo') kpis.ambientes_activos!++;
        else kpis.ambientes_inactivos!++;
        tipoAmbMap[amb.tipo_ambiente] =
          (tipoAmbMap[amb.tipo_ambiente] ?? 0) + 1;
        kpis.capacidad!.total += amb.capacidad.total ?? 0;
        kpis.capacidad!.examen += amb.capacidad.examen ?? 0;
        kpis.activos_asociados! += amb.activos_count ?? 0;
      }
    }
    kpis.tipos_bloque = tipoBloqueMap;
    kpis.total_tipos_bloque = Object.keys(tipoBloqueMap).length;
    kpis.tipos_ambiente = tipoAmbMap;
    kpis.total_tipos_ambiente = Object.keys(tipoAmbMap).length;
    return kpis;
  }

  private buildFacultadesKpis(facultades: FacultadView[]): KpiResumen {
    const kpis: KpiResumen = {
      total_facultades: facultades.length,
      facultades_activas: 0,
      facultades_inactivas: 0,
      total_bloques: 0,
      bloques_activos: 0,
      bloques_inactivos: 0,
      total_tipos_bloque: 0,
      tipos_bloque: {},
      total_ambientes: 0,
      ambientes_activos: 0,
      ambientes_inactivos: 0,
      total_tipos_ambiente: 0,
      tipos_ambiente: {},
      capacidad: { total: 0, examen: 0 },
      activos_asociados: 0,
    };

    const tiposBloqueMap: Record<string, number> = {};
    const tiposAmbMap: Record<string, number> = {};

    for (const f of facultades) {
      if (f.estado === 'activo') kpis.facultades_activas!++;
      else kpis.facultades_inactivas!++;

      kpis.total_bloques! += f.bloques.length;
      for (const b of f.bloques) {
        if (b.estado === 'activo') kpis.bloques_activos!++;
        else kpis.bloques_inactivos!++;
        tiposBloqueMap[b.tipo_bloque] =
          (tiposBloqueMap[b.tipo_bloque] ?? 0) + 1;

        kpis.total_ambientes! += b.ambientes.length;
        for (const amb of b.ambientes) {
          if (amb.estado === 'activo') kpis.ambientes_activos!++;
          else kpis.ambientes_inactivos!++;
          tiposAmbMap[amb.tipo_ambiente] =
            (tiposAmbMap[amb.tipo_ambiente] ?? 0) + 1;
          kpis.capacidad!.total += amb.capacidad.total ?? 0;
          kpis.capacidad!.examen += amb.capacidad.examen ?? 0;
          kpis.activos_asociados! += amb.activos_count ?? 0;
        }
      }
    }

    kpis.tipos_bloque = tiposBloqueMap;
    kpis.total_tipos_bloque = Object.keys(tiposBloqueMap).length;
    kpis.tipos_ambiente = tiposAmbMap;
    kpis.total_tipos_ambiente = Object.keys(tiposAmbMap).length;

    return kpis;
  }

  private groupBy<T, K extends keyof any>(
    items: T[],
    keyFn: (item: T) => K,
  ): Record<K, T[]> {
    return items.reduce(
      (acc, item) => {
        const key = keyFn(item);
        acc[key] = acc[key] ?? [];
        acc[key].push(item);
        return acc;
      },
      {} as Record<K, T[]>,
    );
  }
}

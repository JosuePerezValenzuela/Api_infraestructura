import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { AmbienteDetalleViewModel } from '../../domain/ports/ambiente-reporte.repository';
import type { AmbienteReporteRepository } from '../../domain/ports/ambiente-reporte.repository';

type HeaderRow = {
  ambiente_id: number;
  ambiente_codigo: string;
  ambiente_nombre: string;
  ambiente_nombre_corto?: string | null;
  piso: number;
  clases: boolean;
  activo: boolean;
  capacidad: { total?: number; examen?: number } | null;
  dimension?: {
    largo?: number;
    ancho?: number;
    alto?: number;
    unid_med?: string;
  } | null;
  creado_en: Date | string;
  actualizado_en: Date | string;
  bloque_id: number;
  bloque_codigo: string;
  bloque_nombre: string;
  tipo_bloque_id: number;
  tipo_bloque_nombre: string;
  facultad_id: number;
  facultad_codigo: string;
  facultad_nombre: string;
  facultad_nombre_corto?: string | null;
  campus_id: number;
  campus_codigo: string;
  campus_nombre: string;
  tipo_ambiente_id: number;
  tipo_ambiente_nombre: string;
};

type HorarioRow = { dia: number; hora_inicio: string; hora_fin: string };
type ActivoRow = { nia: string; nombre: string; descripcion?: string | null };

@Injectable()
export class AmbienteReporteRepositoryAdapter implements AmbienteReporteRepository {
  constructor(@Inject(DataSource) private readonly dataSource: DataSource) {}

  async obtenerPorCodigo(codigo: string): Promise<AmbienteDetalleViewModel | null> {
    // Consulta principal para traer el ambiente y su jerarquia relacionada.
    const headerRows: HeaderRow[] = await this.dataSource.query(
      `
        SELECT
          a.id AS ambiente_id,
          a.codigo AS ambiente_codigo,
          a.nombre AS ambiente_nombre,
          a.nombre_corto AS ambiente_nombre_corto,
          a.piso,
          a.clases,
          a.activo,
          a.capacidad,
          a.dimension,
          a.creado_en,
          a.actualizado_en,
          b.id AS bloque_id,
          b.codigo AS bloque_codigo,
          b.nombre AS bloque_nombre,
          tb.id AS tipo_bloque_id,
          tb.nombre AS tipo_bloque_nombre,
          f.id AS facultad_id,
          f.codigo AS facultad_codigo,
          f.nombre AS facultad_nombre,
          f.nombre_corto AS facultad_nombre_corto,
          c.id AS campus_id,
          c.codigo AS campus_codigo,
          c.nombre AS campus_nombre,
          ta.id AS tipo_ambiente_id,
          ta.nombre AS tipo_ambiente_nombre
        FROM infraestructura.ambientes a
        JOIN infraestructura.bloques b ON b.id = a.bloque_id AND b.activo = true
        JOIN infraestructura.campus_facultades cf ON cf.id = b.campus_facultad_id AND cf.activo = true
        JOIN infraestructura.campus c ON c.id = cf.campus_id AND c.activo = true
        JOIN infraestructura.facultades f ON f.id = cf.facultad_id AND f.activo = true
        JOIN infraestructura.tipo_bloques tb ON tb.id = b.tipo_bloque_id
        JOIN infraestructura.tipo_ambientes ta ON ta.id = a.tipo_ambiente_id
        WHERE a.codigo = $1 AND a.activo = true
        LIMIT 1
      `,
      [codigo],
    );

    const header = headerRows[0];
    if (!header) {
      return null;
    }

    // Horarios de operacion del ambiente por dia.
    const horarios: HorarioRow[] = await this.dataSource.query(
      `
        SELECT
          dia,
          to_char(hora_inicio, 'HH24:MI') AS hora_inicio,
          to_char(hora_fin, 'HH24:MI') AS hora_fin
        FROM infraestructura.horarios_operacion
        WHERE ambiente_id = $1
        ORDER BY dia ASC
      `,
      [header.ambiente_id],
    );

    // Activos asociados al ambiente, ordenados por NIA.
    const activos: ActivoRow[] = await this.dataSource.query(
      `
        SELECT
          nia,
          nombre,
          descripcion
        FROM infraestructura.activos
        WHERE ambiente_id = $1
        ORDER BY nia ASC
      `,
      [header.ambiente_id],
    );

    const capacidad = header.capacidad ?? { total: 0, examen: 0 };
    const dimension =
      header.dimension ??
      ({
        largo: 0,
        ancho: 0,
        alto: 0,
        unid_med: 'metros',
      } as { largo: number; ancho: number; alto: number; unid_med: string });

    const toIso = (value: Date | string): string =>
      value instanceof Date ? value.toISOString() : String(value);

    return {
      ambiente: {
        id: header.ambiente_id,
        codigo: header.ambiente_codigo,
        nombre: header.ambiente_nombre,
        nombre_corto: header.ambiente_nombre_corto ?? null,
        piso: header.piso,
        clases: header.clases,
        activo: header.activo,
        capacidad: {
          total: Number(capacidad.total ?? 0),
          examen: Number(capacidad.examen ?? 0),
        },
        dimension: {
          largo: Number(dimension.largo ?? 0),
          ancho: Number(dimension.ancho ?? 0),
          alto: Number(dimension.alto ?? 0),
          unid_med: dimension.unid_med ?? 'metros',
        },
        creado_en: toIso(header.creado_en),
        actualizado_en: toIso(header.actualizado_en),
      },
      bloque: {
        id: header.bloque_id,
        codigo: header.bloque_codigo,
        nombre: header.bloque_nombre,
        tipo_bloque: {
          id: header.tipo_bloque_id,
          nombre: header.tipo_bloque_nombre,
        },
      },
      facultad: {
        id: header.facultad_id,
        codigo: header.facultad_codigo,
        nombre: header.facultad_nombre,
        nombre_corto: header.facultad_nombre_corto ?? null,
      },
      campus: {
        id: header.campus_id,
        codigo: header.campus_codigo,
        nombre: header.campus_nombre,
      },
      tipo_ambiente: {
        id: header.tipo_ambiente_id,
        nombre: header.tipo_ambiente_nombre,
      },
      horarios: horarios.map((h) => ({
        dia: h.dia,
        hora_inicio: h.hora_inicio,
        hora_fin: h.hora_fin,
      })),
      activos: activos.map((a) => ({
        nia: a.nia,
        nombre: a.nombre,
        descripcion: a.descripcion ?? null,
      })),
      disponibilidadMatriz: [], // se calcula en la capa de aplicacion
    };
  }
}

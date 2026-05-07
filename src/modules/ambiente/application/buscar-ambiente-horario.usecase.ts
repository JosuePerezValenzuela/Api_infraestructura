import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  BuscarAmbienteHorarioParams,
  BuscarAmbienteHorarioResult,
  HorarioOperacionItem,
} from '../domain/buscar-ambiente-horario.types';

const DIAS = [
  'Lunes',
  'Martes',
  'Miercoles',
  'Jueves',
  'Viernes',
  'Sabado',
  'Domingo',
];

interface AmbienteEncontradoRow {
  id: string;
  codigo: string;
  nombre: string;
  nombre_corto: string | null;
  piso: string;
  capacidad: string;
  dimension: string;
  clases: string;
  activo: string;
  bloque_id: string;
  bloque_nombre: string;
  tipo_ambiente_id: string;
  tipo_ambiente_nombre: string;
  facultad_id: string;
  facultad_nombre: string;
  campus_id: string;
  campus_nombre: string;
}

interface HorarioRow {
  dia: string;
  hora_inicio: string;
  hora_fin: string;
  periodo: string;
}

@Injectable()
export class BuscarAmbienteHorarioUseCase {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async execute(
    params: BuscarAmbienteHorarioParams,
  ): Promise<BuscarAmbienteHorarioResult> {
    // 1. Buscar facultad por código
    const facultad = await this.findFacultadByCodigo(params.codigo_facultad);
    if (!facultad) {
      throw new NotFoundException({
        error: 'NOT_FOUND',
        message: `Facultad no encontrada con código: ${params.codigo_facultad}`,
      });
    }

    // 2. Buscar ambiente(s) en esa facultad
    const ambientes = await this.findAmbientes(
      params.codigo_facultad,
      params.codigo_ambiente,
      params.piso,
    );

    if (ambientes.length === 0) {
      throw new NotFoundException({
        error: 'NOT_FOUND',
        message: `No se encontró ningún ambiente con código '${params.codigo_ambiente}' en la facultad especificada`,
      });
    }

    // 3. Verificar que no haya duplicados
    if (ambientes.length > 1) {
      throw new ConflictException({
        error: 'CONFLICT_ERROR',
        message: 'Se encontró más de un ambiente con el código especificado',
        details: [
          {
            field: 'codigo_ambiente',
            message:
              'Existe más de un ambiente con este código en el mismo piso',
          },
        ],
      });
    }

    const ambiente = ambientes[0];

    // 4. Buscar horario de operación para el día específico
    const horario = await this.findHorarioByAmbienteAndDia(
      Number(ambiente.id),
      params.dia,
    );

    // 5. Verificar si el rango está dentro del horario de operación
    let dentro_horario = false;
    if (horario) {
      dentro_horario = this.estaDentroDelHorario(
        params.hora_inicio,
        params.hora_fin,
        horario.hora_inicio,
        horario.hora_fin,
      );
    }

    // 6. Mapear resultado
    const capacidad = this.mapCapacidad(ambiente.capacidad);
    const dimension = this.mapDimension(ambiente.dimension);

    const horarioItem: HorarioOperacionItem | null = horario
      ? {
          dia: Number(horario.dia),
          nombre_dia: DIAS[Number(horario.dia)],
          hora_inicio: horario.hora_inicio,
          hora_fin: horario.hora_fin,
          periodo: Number(horario.periodo),
        }
      : null;

    return {
      id: Number(ambiente.id),
      codigo: ambiente.codigo,
      nombre: ambiente.nombre,
      nombre_corto: ambiente.nombre_corto,
      piso: Number(ambiente.piso),
      capacidad,
      dimension,
      clases: ambiente.clases === 'true',
      activo: ambiente.activo === 'true',
      bloque_id: Number(ambiente.bloque_id),
      bloque_nombre: ambiente.bloque_nombre,
      tipo_ambiente_id: Number(ambiente.tipo_ambiente_id),
      tipo_ambiente_nombre: ambiente.tipo_ambiente_nombre,
      facultad_id: Number(ambiente.facultad_id),
      facultad_nombre: ambiente.facultad_nombre,
      campus_id: Number(ambiente.campus_id),
      campus_nombre: ambiente.campus_nombre,
      horario_operacion: horarioItem,
      dentro_horario,
    };
  }

  private async findFacultadByCodigo(
    codigo: string,
  ): Promise<{ id: number; codigo: string; nombre: string } | null> {
    const sql = `
      SELECT id, codigo, nombre
      FROM infraestructura.facultades
      WHERE codigo = $1
      LIMIT 1
    `;
    const rows = await this.dataSource.query<
      { id: string; codigo: string; nombre: string }[]
    >(sql, [codigo]);
    if (rows.length === 0) {
      return null;
    }
    return {
      id: Number(rows[0].id),
      codigo: rows[0].codigo,
      nombre: rows[0].nombre,
    };
  }

  private async findAmbientes(
    codigo_facultad: string,
    codigo_ambiente: string,
    piso: number,
  ): Promise<AmbienteEncontradoRow[]> {
    const sql = `
      SELECT
        a.id,
        a.codigo,
        a.nombre,
        a.nombre_corto,
        a.piso,
        a.capacidad,
        a.dimension,
        a.clases,
        a.activo,
        b.id AS bloque_id,
        b.nombre AS bloque_nombre,
        ta.id AS tipo_ambiente_id,
        ta.nombre AS tipo_ambiente_nombre,
        f.id AS facultad_id,
        f.nombre AS facultad_nombre,
        c.id AS campus_id,
        c.nombre AS campus_nombre
      FROM infraestructura.ambientes a
      INNER JOIN infraestructura.bloques b ON b.id = a.bloque_id
      INNER JOIN infraestructura.tipo_ambientes ta ON ta.id = a.tipo_ambiente_id
      INNER JOIN infraestructura.facultades f ON f.id = b.facultad_id
      INNER JOIN infraestructura.campus c ON c.id = f.campus_id
      WHERE f.codigo = $1
        AND a.codigo = $2
        AND a.piso = $3
      LIMIT 2
    `;
    return this.dataSource.query<AmbienteEncontradoRow[]>(sql, [
      codigo_facultad,
      codigo_ambiente,
      piso,
    ]);
  }

  private async findHorarioByAmbienteAndDia(
    ambienteId: number,
    dia: number,
  ): Promise<HorarioRow | null> {
    const sql = `
      SELECT dia, hora_inicio, hora_fin, periodo
      FROM infraestructura.horarios_operacion
      WHERE ambiente_id = $1 AND dia = $2
      LIMIT 1
    `;
    const rows = await this.dataSource.query<HorarioRow[]>(sql, [
      ambienteId,
      dia,
    ]);
    if (rows.length === 0) {
      return null;
    }
    return rows[0];
  }

  private estaDentroDelHorario(
    hora_inicio: string,
    hora_fin: string,
    horario_inicio: string,
    horario_fin: string,
  ): boolean {
    // Convertir HH:mm a minutos
    const toMinutes = (time: string): number => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };

    const inicio = toMinutes(hora_inicio);
    const fin = toMinutes(hora_fin);
    const horarioInicio = toMinutes(horario_inicio);
    const horarioFin = toMinutes(horario_fin);

    // El rango solicitado debe estar completamente dentro del horario de operación
    return inicio >= horarioInicio && fin <= horarioFin;
  }

  private mapCapacidad(value: unknown): { total: number; examen: number } {
    const data = this.ensureJsonObject(value);
    return {
      total: Number(data.total ?? 0),
      examen: Number(data.examen ?? 0),
    };
  }

  private mapDimension(value: unknown): {
    largo: number;
    ancho: number;
    alto: number;
    unid_med: string;
  } {
    const data = this.ensureJsonObject(value);
    return {
      largo: Number(data.largo ?? 0),
      ancho: Number(data.ancho ?? 0),
      alto: Number(data.alto ?? 0),
      unid_med: typeof data.unid_med === 'string' ? data.unid_med : 'metros',
    };
  }

  private ensureJsonObject(value: unknown): Record<string, unknown> {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (parsed && typeof parsed === 'object') {
          return parsed as Record<string, unknown>;
        }
      } catch {
        return {};
      }
    }

    if (value && typeof value === 'object') {
      return value as Record<string, unknown>;
    }

    return {};
  }
}

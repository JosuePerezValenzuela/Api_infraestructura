export interface HorarioOperacionItem {
  dia: number;
  nombre_dia: string;
  hora_inicio: string;
  hora_fin: string;
  periodo: number;
}

export interface BuscarAmbienteHorarioParams {
  codigo_facultad: string;
  codigo_ambiente: string;
  piso: number;
  dia: number;
  hora_inicio: string;
  hora_fin: string;
}

export interface BuscarAmbienteHorarioResult {
  id: number;
  codigo: string;
  nombre: string;
  nombre_corto: string | null;
  piso: number;
  capacidad: { total: number; examen: number };
  dimension: { largo: number; ancho: number; alto: number; unid_med: string };
  clases: boolean;
  activo: boolean;
  bloque_id: number;
  bloque_nombre: string;
  tipo_ambiente_id: number;
  tipo_ambiente_nombre: string;
  facultad_id: number;
  facultad_nombre: string;
  campus_id: number;
  campus_nombre: string;
  horario_operacion: HorarioOperacionItem | null;
  dentro_horario: boolean;
}

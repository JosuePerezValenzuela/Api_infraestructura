import { HorarioSlot } from './horario.repository.port';

export type DisponiblesHorarioFiltro = HorarioSlot;

export interface ListAmbientesDisponiblesQuery {
  capacidad_min?: number;
  capacidad_examen_min?: number;
  mismo_piso?: boolean;
  tipo_ambiente_ids?: number[];
  campus_ids?: number[];
  facultad_ids?: number[];
  bloque_ids?: number[];
  tipo_bloque_ids?: number[];
  horario?: DisponiblesHorarioFiltro;
  page?: number;
  take?: number;
  orderBy?:
    | 'nombre'
    | 'codigo'
    | 'piso'
    | 'capacidad_examen_total'
    | 'capacidad_total';
  orderDir?: 'asc' | 'desc';
}

export type AmbientesDisponiblesOrderBy = NonNullable<
  ListAmbientesDisponiblesQuery['orderBy']
>;

export interface AmbienteDisponibleItem {
  id: number;
  codigo: string;
  nombre: string;
  nombre_corto: string | null;
  piso: number;
  capacidad: { total: number; examen: number };
  clases: boolean;
  activo: boolean;
  tipo_ambiente_id: number;
  tipo_ambiente_nombre: string;
}

export interface ListAmbientesDisponiblesResult {
  items: Array<{
    campus_id: number;
    campus_nombre: string;
    facultad_id: number;
    facultad_nombre: string;
    bloque_id: number;
    bloque_nombre: string;
    tipo_bloque_id: number;
    tipo_bloque_nombre: string;
    piso: number;
    capacidad_examen_total: number;
    capacidad_total: number;
    ambientes: AmbienteDisponibleItem[];
  }>;
  meta: {
    total: number;
    page: number;
    take: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

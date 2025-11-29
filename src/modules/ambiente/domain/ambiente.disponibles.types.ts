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
  orderBy?: 'nombre' | 'codigo' | 'piso';
  orderDir?: 'asc' | 'desc';
}

export interface AmbienteDisponibleItem {
  id: number;
  codigo: string;
  nombre: string;
  nombre_corto: string | null;
  piso: number;
  capacidad: { total: number; examen: number };
  clases: boolean;
  activo: boolean;
  bloque_id: number;
  facultad_id: number;
  campus_id: number;
  tipo_bloque_id: number;
  tipo_ambiente_id: number;
}

export interface ListAmbientesDisponiblesResult {
  items: AmbienteDisponibleItem[];
  meta: {
    total: number;
    page: number;
    take: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

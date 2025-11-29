export type AmbienteListOrderDir = 'asc' | 'desc';

export type AmbienteListOrderBy =
  | 'nombre'
  | 'codigo'
  | 'piso'
  | 'activo'
  | 'creado_en';

export interface ListAmbientesOptions {
  page: number;
  take: number;
  search: string | null;
  orderBy: AmbienteListOrderBy;
  orderDir: AmbienteListOrderDir;
  bloqueId: number | null;
  facultadId: number | null;
  tipoAmbienteId: number | null;
  activo: boolean | null;
  clases: boolean | null;
  pisoMin: number | null;
  pisoMax: number | null;
}

export interface AmbienteListItem {
  id: number;
  codigo: string;
  nombre: string;
  nombre_corto: string | null;
  piso: number;
  capacidad: { total: number; examen: number };
  dimension: { largo: number; ancho: number; alto: number; unid_med: string };
  clases: boolean;
  activo: boolean;
  creado_en: string;
  bloque_nombre: string;
  facultad_nombre: string;
  tipo_ambiente_nombre: string;
}

export interface AmbientItem {
  id: number;
  codigo: string;
  nombre: string;
  nombre_corto: string | null;
  piso: number;
  capacidad: { total: number; examen: number };
  dimension: { largo: number; ancho: number; alto: number; unid_med: string };
  clases: boolean;
  activo: boolean;
  creado_en: string;
  tipo_ambiente_id: number;
  bloque_id: number;
  hora_apertura?: string | null;
  hora_cierre?: string | null;
  periodo?: number | null;
}

export interface ListAmbientesResult {
  items: AmbienteListItem[];
  meta: {
    total: number;
    page: number;
    take: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

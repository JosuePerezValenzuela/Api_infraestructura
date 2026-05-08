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
  campusId: number | null;
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
  // Bloque
  bloque_id: number;
  bloque_nombre: string;
  // Tipo de ambiente
  tipo_ambiente_id: number;
  tipo_ambiente_nombre: string;
  // Campus-Facultad
  campus_id: number;
  campus_nombre: string;
  facultad_id: number;
  facultad_nombre: string;
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
}

export interface AmbienteCompletoItem extends AmbientItem {
  bloque_nombre: string;
  tipo_ambiente_nombre: string;
  tipo_bloque_id: number;
  tipo_bloque_nombre: string;
  facultad_id: number;
  facultad_nombre: string;
  campus_id: number;
  campus_nombre: string;
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

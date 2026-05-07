export type BloqueListOrderDir = 'asc' | 'desc';

export type BloqueListOrderBy =
  | 'codigo'
  | 'nombre'
  | 'pisos'
  | 'activo'
  | 'creado_en';

export interface ListBloquesOptions {
  page: number;
  take: number;
  search: string | null;
  orderBy: BloqueListOrderBy;
  orderDir: BloqueListOrderDir;
  facultadId: number | null;
  campusId: number | null;
  tipoBloqueId: number | null;
  activo: boolean | null;
  pisosMin: number | null;
  pisosMax: number | null;
}

export interface BloqueListItem {
  id: number;
  codigo: string;
  nombre: string;
  nombre_corto: string | null;
  pisos: number;
  activo: boolean;
  creado_en: string;
  // Información de campus-facultad
  campus_facultad_id: number;
  campus_id: number;
  campus_nombre: string;
  facultad_id: number;
  facultad_nombre: string;
  // Tipo de bloque
  tipo_bloque_id: number;
  tipo_bloque_nombre: string;
  // Coordenadas
  lat: number;
  lng: number;
}

export interface ListBloquesResult {
  items: BloqueListItem[];
  meta: {
    total: number;
    page: number;
    take: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

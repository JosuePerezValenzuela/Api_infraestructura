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
  facultad_nombre: string;
  tipo_bloque_nombre: string;
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

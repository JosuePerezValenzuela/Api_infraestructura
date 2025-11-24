export type ActivoListOrderDir = 'asc' | 'desc';

export type ActivoListOrderBy = 'nia' | 'nombre' | 'creado_en';

export interface ListActivosOptions {
  page: number;
  take: number;
  search: string | null;
  orderBy: ActivoListOrderBy;
  orderDir: ActivoListOrderDir;
  ambienteId: number | null;
}

export interface ActivoListItem {
  id: number;
  nia: string;
  nombre: string;
  descripcion: string | null;
  creado_en: string;
  ambiente_id: number | null;
  ambiente_nombre: string | null;
  ambiente_codigo: string | null;
}

export interface ListActivosResult {
  items: ActivoListItem[];
  meta: {
    total: number;
    page: number;
    take: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

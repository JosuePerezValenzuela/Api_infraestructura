// Este archivo define los tipos utilizados para listar tipos de bloque y compartirlos entre capas.

export type TipoBloqueOrderBy = 'nombre' | 'creado_en' | 'descripcion';
export type TipoBloqueOrderDir = 'asc' | 'desc';

// Lo que tiene la tabla en la BD
export interface TipoBloqueListItem {
  id: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
  creado_en: Date;
  actualizado_en: Date;
}

// Opciones para hacer el listado
export interface ListTipoBloquesOptions {
  page: number;
  take: number;
  search?: string | null;
  orderBy: TipoBloqueOrderBy;
  orderDir: TipoBloqueOrderDir;
}

// Lo que devolvera la api
export interface ListTipoBloquesResult {
  items: TipoBloqueListItem[];
  meta: {
    total: number;
    page: number;
    take: number;
    pages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

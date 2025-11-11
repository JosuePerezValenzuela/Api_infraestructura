export type TipoAmbienteOrderBy = 'nombre' | 'creado_en';
export type TipoAmbienteOrderDir = 'asc' | 'desc';

export interface TipoAmbienteListItem {
  id: number;
  nombre: string;
  descripcion: string;
  descripcion_corta: string | null;
  activo: boolean;
  creado_en: Date;
  actualizado_en: Date;
}

export interface ListTipoAmbientesOptions {
  page: number;
  take: number;
  search?: string | null;
  orderBy: TipoAmbienteOrderBy;
  orderDir: TipoAmbienteOrderDir;
}

export interface ListTipoAmbientesResult {
  items: TipoAmbienteListItem[];
  meta: {
    total: number;
    page: number;
    take: number;
    pages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

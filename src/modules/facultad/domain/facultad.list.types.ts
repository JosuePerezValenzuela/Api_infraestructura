// Este archivo agrupa los tipos compartidos para listar facultades y facilita reutilizarlos en distintas capas.

export interface facultadCompleta {
  id: number;
  codigo: string;
  nombre: string;
  nombre_corto: string | null;
  lat: number;
  lng: number;
  activo: boolean;
  campus_id: number;
}
export interface ListFacultadesQuery {
  page: number;
  take: number;
  search?: string | null;
  orderBy: 'nombre' | 'codigo' | 'creado_en';
  orderDir: 'asc' | 'desc';
}

export interface ListFacultadesItem {
  id: number;
  codigo: string;
  nombre: string;
  nombre_corto: string | null;
  campus_nombre: string;
  activo: boolean;
  creado_en: string;
}

export interface ListFacultadesMeta {
  total: number;
  page: number;
  take: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ListFacultadesResult {
  items: ListFacultadesItem[];
  meta: ListFacultadesMeta;
}

export interface UpdateFacultadesInput {
  codigo?: string;
  nombre?: string;
  nombre_corto?: string;
  lat?: number;
  lng?: number;
  activo?: boolean;
  campus_id?: number;
}

export interface UpdateFacultadesInputAndId {
  id: number;
  input: Partial<UpdateFacultadesInput>;
}

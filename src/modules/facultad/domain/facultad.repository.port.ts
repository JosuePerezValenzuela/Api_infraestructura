// Tipos que el caso de uso necesitara

// Tipo que espera el metodo create
export interface CreateFacultadData {
  codigo: string;
  nombre: string;
  nombre_corto: string | null;
  pointLiteral: string;
  campus_id: number;
}

export interface ListFacultadesQuery {
  page: number;
  take: number;
  search?: string;
  orderBy?: 'nombre' | 'codigo' | 'creado_en';
  orderDir?: 'asc' | 'desc';
}

export interface ListFacultadesItem {
  id: number;
  codigo: string;
  nombre: string;
  nombre_corto: string | null;
  campus_nombre: string;
  activo: boolean;
  creado_en: Date;
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

export const FacultadRepositoryPort = Symbol('FacultadRepositoryPort');

export interface FacultadRepositoryPort {
  create(data: CreateFacultadData): Promise<{ id: number }>;

  isCodeTaken(codigo: string): Promise<boolean>;

  findPaginated(opts: ListFacultadesQuery): Promise<ListFacultadesResult>;
}

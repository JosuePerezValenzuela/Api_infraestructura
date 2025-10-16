// Tipos que el caso de uso necesitara

import type {
  ListFacultadesQuery,
  ListFacultadesResult,
  UpdateFacultadesInput,
  ListFacultadesItem,
} from './facultad.list.types';

// Tipo que espera el metodo create
export interface CreateFacultadData {
  codigo: string;
  nombre: string;
  nombre_corto: string | null;
  pointLiteral: string;
  campus_id: number;
}

export const FacultadRepositoryPort = Symbol('FacultadRepositoryPort');

export interface FacultadRepositoryPort {
  create(data: CreateFacultadData): Promise<{ id: number }>;

  isCodeTaken(codigo: string): Promise<boolean>;

  findById(id: number): Promise<ListFacultadesItem | null>;

  findPaginated(opts: ListFacultadesQuery): Promise<ListFacultadesResult>;

  update(id: number, input: UpdateFacultadesInput): Promise<{ id: number }>;
}

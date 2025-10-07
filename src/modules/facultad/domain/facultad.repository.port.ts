// Tipos que el caso de uso necesitara
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

  isCodeTaken(codigo: string): Promise<{ boolean: boolean }>;
}

// Tipos que el caso de uso necesitara

import type {
  ListFacultadesQuery,
  ListFacultadesResult,
  UpdateFacultadesInput,
  facultadCompleta,
} from './facultad.list.types';

// Tipo que espera el metodo create
export interface CreateFacultadData {
  codigo: string;
  nombre: string;
  nombre_corto: string | null;
  campus_ids: number[];
}

export const FacultadRepositoryPort = Symbol('FacultadRepositoryPort');

export interface RelatedBlock {
  id: number;
  codigo: string;
  nombre: string;
  nombre_corto: string | null;
  activo: boolean;
  campus_nombre: string;
}

export interface FacultadRepositoryPort {
  create(data: CreateFacultadData): Promise<{ id: number }>;

  isCodeTaken(codigo: string, excludeId?: number): Promise<boolean>;

  findById(id: number): Promise<facultadCompleta | null>;

  findPaginated(opts: ListFacultadesQuery): Promise<ListFacultadesResult>;

  update(id: number, input: UpdateFacultadesInput): Promise<{ id: number }>;

  // Métodos para validar relación campus-facultad (usados por otros módulos)
  findCampusById(campusId: number): Promise<{ id: number } | null>;

  findCampusFacultadRelationship(
    facultadId: number,
    campusId: number,
  ): Promise<{ id: number } | null>;

  // Métodos para delete de UNA relación específica
  // Busca bloques que dependen de una relación específica (campus_facultad_id)
  findBlocksByCampusFacultadId(campus_facultadId: number): Promise<RelatedBlock[]>;

  // Elimina una relación específica (facultad + campus)
  deleteRelationship(facultadId: number, campusId: number): Promise<{ id: number }>;

  // Verifica si la facultad tiene otras relaciones (activas o inactivas, después de eliminar)
  hasOtherRelationships(facultadId: number, excludeCampusId: number): Promise<boolean>;

  // Elimina la facultad físicamente
  deleteFacultad(facultadId: number): Promise<{ id: number }>;
}
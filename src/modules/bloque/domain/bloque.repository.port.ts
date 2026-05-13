import { CreateBloqueCommand } from './commands/create-bloque.command';
import { UpdateBloqueCommand } from './commands/update-bloque.command';
import { ListBloquesOptions, ListBloquesResult } from './bloque.list.types';

export const BloqueRepositoryPort = Symbol('BloqueRepositoryPort');

export interface BloqueSnapshot {
  id: number;
  codigo: string;
  nombre: string;
  nombre_corto: string | null;
  pisos: number;
  activo: boolean;
  campus_facultad_id: number;
  facultad_id: number;
  campus_id: number;
  tipo_bloque_id: number;
  coordenadas: {
    lat: number;
    lng: number;
  };
}
export interface RelatedAmbiente {
  id: number;
  codigo: string;
  nombre: string;
  nombre_corto: string | null;
  tipo_ambiente_nombre: string;
  activo: boolean;
}

export interface BloqueRepositoryPort {
  create(command: CreateBloqueCommand): Promise<{ id: number }>;

  isCodeTaken(codigo: string, excludeId?: number): Promise<boolean>;

  list(options: ListBloquesOptions): Promise<ListBloquesResult>;

  update(command: UpdateBloqueCommand): Promise<{ id: number }>;

  findById(id: number): Promise<BloqueSnapshot | null>;

  // Métodos para delete
  findRelatedAmbientes(bloqueId: number): Promise<RelatedAmbiente[]>;

  delete(bloqueId: number): Promise<{ id: number }>;
}

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
  facultad_id: number;
  tipo_bloque_id: number;
  coordenadas: {
    lat: number;
    lng: number;
  };
}
export interface BloqueRepositoryPort {
  create(command: CreateBloqueCommand): Promise<{ id: number }>;

  isCodeTaken(codigo: string, excludeId?: number): Promise<boolean>;

  list(options: ListBloquesOptions): Promise<ListBloquesResult>;

  update(command: UpdateBloqueCommand): Promise<{ id: number }>;

  findById(id: number): Promise<BloqueSnapshot | null>;
}

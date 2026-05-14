import { CreateTipoBloqueCommand } from './commands/create-tipo-bloque.command';
import { UpdateTipoBloqueCommand } from './commands/update-tipo-bloque.command';
import {
  ListTipoBloquesOptions,
  ListTipoBloquesResult,
  TipoBloqueListItem,
} from './tipo-bloque.list.types';

export const TipoBloqueRepositoryPort = Symbol('TipoBloqueRepositoryPort');

export interface RelatedBloque {
  id: number;
  codigo: string;
  nombre: string;
  nombre_corto: string | null;
  activo: boolean;
}

export interface TipoBloqueRepositoryPort {
  create(command: CreateTipoBloqueCommand): Promise<{ id: number }>;

  isNameTaken(nombre: string): Promise<boolean>;

  list(options: ListTipoBloquesOptions): Promise<ListTipoBloquesResult>;

  isNameTakenByOther(nombre: string, id: number): Promise<boolean>;

  findById(id: number): Promise<TipoBloqueListItem | null>;

  update(command: UpdateTipoBloqueCommand): Promise<{ id: number }>;

  // Métodos para delete
  findRelatedBloques(tipoBloqueId: number): Promise<RelatedBloque[]>;

  delete(tipoBloqueId: number): Promise<{ id: number }>;
}

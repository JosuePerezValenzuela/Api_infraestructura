import { CreateTipoBloqueCommand } from './commands/create-tipo-bloque.command';
import { UpdateTipoBloqueCommand } from './commands/update-tipo-bloque.command';
import {
  ListTipoBloquesOptions,
  ListTipoBloquesResult,
  TipoBloqueListItem,
} from './tipo-bloque.list.types';

export const TipoBloqueRepositoryPort = Symbol('TipoBloqueRepositoryPort');

export interface TipoBloqueRepositoryPort {
  create(command: CreateTipoBloqueCommand): Promise<{ id: number }>;

  isNameTaken(nombre: string): Promise<boolean>;

  list(options: ListTipoBloquesOptions): Promise<ListTipoBloquesResult>;

  isNameTakenByOther(nombre: string, id: number): Promise<boolean>;

  findById(id: number): Promise<TipoBloqueListItem | null>;

  update(command: UpdateTipoBloqueCommand): Promise<{ id: number }>;
}

import { CreateTipoBloqueCommand } from './commands/create-tipo-bloque.command';
import {
  ListTipoBloquesOptions,
  ListTipoBloquesResult,
} from './tipo-bloque.list.types';

export const TipoBloqueRepositoryPort = Symbol('TipoBloqueRepositoryPort');

export interface TipoBloqueRepositoryPort {
  create(command: CreateTipoBloqueCommand): Promise<{ id: number }>;

  isNameTaken(nombre: string): Promise<boolean>;

  list(options: ListTipoBloquesOptions): Promise<ListTipoBloquesResult>;
}

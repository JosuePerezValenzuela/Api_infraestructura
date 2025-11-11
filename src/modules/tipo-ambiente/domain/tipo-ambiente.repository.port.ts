import { CreateTipoAmbienteCommand } from './commands/create-tipo-ambiente.command';
import { DeleteTipoAmbienteCommand } from './commands/delete-tipo-ambiente.command';
import {
  ListTipoAmbientesOptions,
  ListTipoAmbientesResult,
} from './tipo-ambiente.list.types';

export const TipoAmbienteRepositoryPort = Symbol('TipoAmbienteRepositoryPort');

export interface TipoAmbienteRepositoryPort {
  create(command: CreateTipoAmbienteCommand): Promise<{ id: number }>;

  isNameTaken(nombre: string): Promise<boolean>;

  list(options: ListTipoAmbientesOptions): Promise<ListTipoAmbientesResult>;

  delete(command: DeleteTipoAmbienteCommand): Promise<{ id: number }>;
}

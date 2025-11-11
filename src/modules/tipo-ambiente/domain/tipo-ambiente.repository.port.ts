import { CreateTipoAmbienteCommand } from './commands/create-tipo-ambiente.command';
import { DeleteTipoAmbienteCommand } from './commands/delete-tipo-ambiente.command';
import {
  ListTipoAmbientesOptions,
  ListTipoAmbientesResult,
  TipoAmbienteListItem,
} from './tipo-ambiente.list.types';
import { UpdateTipoAmbienteCommand } from './commands/update-tipo-ambiente.command';

export const TipoAmbienteRepositoryPort = Symbol('TipoAmbienteRepositoryPort');

export interface TipoAmbienteRepositoryPort {
  create(command: CreateTipoAmbienteCommand): Promise<{ id: number }>;

  isNameTaken(nombre: string): Promise<boolean>;

  list(options: ListTipoAmbientesOptions): Promise<ListTipoAmbientesResult>;

  delete(command: DeleteTipoAmbienteCommand): Promise<{ id: number }>;

  update(command: UpdateTipoAmbienteCommand): Promise<{ id: number }>;

  findById(id: number): Promise<TipoAmbienteListItem | null>;

  isNameTakenByOther(nombre: string, id: number): Promise<boolean>;
}

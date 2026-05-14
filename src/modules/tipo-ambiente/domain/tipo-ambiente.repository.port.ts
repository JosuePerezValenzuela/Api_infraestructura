import { CreateTipoAmbienteCommand } from './commands/create-tipo-ambiente.command';
import {
  ListTipoAmbientesOptions,
  ListTipoAmbientesResult,
  TipoAmbienteListItem,
} from './tipo-ambiente.list.types';
import { UpdateTipoAmbienteCommand } from './commands/update-tipo-ambiente.command';

export const TipoAmbienteRepositoryPort = Symbol('TipoAmbienteRepositoryPort');

export interface RelatedAmbiente {
  id: number;
  codigo: string;
  nombre: string;
  nombre_corto: string | null;
  activo: boolean;
}

export interface TipoAmbienteRepositoryPort {
  create(command: CreateTipoAmbienteCommand): Promise<{ id: number }>;

  isNameTaken(nombre: string): Promise<boolean>;

  list(options: ListTipoAmbientesOptions): Promise<ListTipoAmbientesResult>;

  // Métodos para delete
  findRelatedAmbientes(tipoAmbienteId: number): Promise<RelatedAmbiente[]>;

  delete(tipoAmbienteId: number): Promise<{ id: number }>;

  update(command: UpdateTipoAmbienteCommand): Promise<{ id: number }>;

  findById(id: number): Promise<TipoAmbienteListItem | null>;

  isNameTakenByOther(nombre: string, id: number): Promise<boolean>;
}

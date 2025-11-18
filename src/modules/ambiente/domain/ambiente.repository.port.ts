import { CreateAmbienteCommand } from './commands/create-ambiente.command';
import {
  ListAmbientesOptions,
  ListAmbientesResult,
  AmbientItem,
} from './ambiente.list.types';
import { DeleteAmbienteCommand } from './commands/delete-ambiente.command';

export const AmbienteRepositoryPort = Symbol('AmbienteRepositoryPort');

export interface CreateAmbienteResult {
  id: number;
}

export interface AmbienteRepositoryPort {
  create(command: CreateAmbienteCommand): Promise<CreateAmbienteResult>;

  isCodeTaken(codigo: string, excludeId?: number): Promise<boolean>;

  list(options: ListAmbientesOptions): Promise<ListAmbientesResult>;

  findById(id: number): Promise<AmbientItem | null>;

  delete(command: DeleteAmbienteCommand): Promise<{ id: number }>;

  deleteAssets(ambienteId: number): Promise<void>;
}

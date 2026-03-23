import { CreateAmbienteCommand } from './commands/create-ambiente.command';
import {
  ListAmbientesOptions,
  ListAmbientesResult,
  AmbientItem,
  AmbienteCompletoItem,
} from './ambiente.list.types';
import { DeleteAmbienteCommand } from './commands/delete-ambiente.command';
import { UpdateAmbienteCommand } from './commands/update-ambiente.command';

export const AmbienteRepositoryPort = Symbol('AmbienteRepositoryPort');

export interface CreateAmbienteResult {
  id: number;
}

export interface AmbienteRepositoryPort {
  create(command: CreateAmbienteCommand): Promise<CreateAmbienteResult>;

  isCodeTaken(codigo: string, excludeId?: number): Promise<boolean>;

  list(options: ListAmbientesOptions): Promise<ListAmbientesResult>;

  findById(id: number): Promise<AmbientItem | null>;

  findByIdWithRelations(id: number): Promise<AmbienteCompletoItem | null>;

  delete(command: DeleteAmbienteCommand): Promise<{ id: number }>;

  deleteAssets(ambienteId: number): Promise<void>;

  update(command: UpdateAmbienteCommand): Promise<{ id: number }>;
}

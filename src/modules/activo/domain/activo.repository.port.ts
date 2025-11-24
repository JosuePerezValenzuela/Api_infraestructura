import { CreateActivoCommand } from './commands/create-activo.command';
import { DeleteActivoCommand } from './commands/delete-activo.command';
import { ListActivosOptions, ListActivosResult } from './activo.list.types';

export const ActivoRepositoryPort = Symbol('ActivoRepositoryPort');

export interface ActivoRepositoryPort {
  create(command: CreateActivoCommand): Promise<{ id: number }>;

  isNiaTaken(nia: string): Promise<boolean>;

  findById(id: number): Promise<{ id: number } | null>;

  delete(command: DeleteActivoCommand): Promise<{ id: number }>;

  list(options: ListActivosOptions): Promise<ListActivosResult>;
}

import { CreateActivoCommand } from './commands/create-activo.command';
import { ListActivosOptions, ListActivosResult } from './activo.list.types';

export const ActivoRepositoryPort = Symbol('ActivoRepositoryPort');

export interface ActivoRepositoryPort {
  create(command: CreateActivoCommand): Promise<{ id: number }>;

  isNiaTaken(nia: string): Promise<boolean>;

  list(options: ListActivosOptions): Promise<ListActivosResult>;
}

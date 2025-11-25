import { CreateActivoCommand } from './commands/create-activo.command';
import { DeleteActivoCommand } from './commands/delete-activo.command';
import { UpdateActivoCommand } from './commands/update-activo.command';
import { AssignActivosToAmbienteCommand } from './commands/assign-activos-to-ambiente.command';
import { ListActivosOptions, ListActivosResult } from './activo.list.types';

export const ActivoRepositoryPort = Symbol('ActivoRepositoryPort');

export interface ActivoRepositoryPort {
  create(command: CreateActivoCommand): Promise<{ id: number }>;

  isNiaTaken(nia: string, excludeId?: number): Promise<boolean>;

  findById(id: number): Promise<{ id: number } | null>;

  delete(command: DeleteActivoCommand): Promise<{ id: number }>;

  update(command: UpdateActivoCommand): Promise<{ id: number }>;

  assignToAmbiente(
    ambienteId: number,
    activoIds: AssignActivosToAmbienteCommand['activoIds'],
  ): Promise<{ updatedIds: number[] }>;

  list(options: ListActivosOptions): Promise<ListActivosResult>;
}

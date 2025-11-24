import { ListActivosOptions, ListActivosResult } from './activo.list.types';

export const ActivoRepositoryPort = Symbol('ActivoRepositoryPort');

export interface ActivoRepositoryPort {
  list(options: ListActivosOptions): Promise<ListActivosResult>;
}

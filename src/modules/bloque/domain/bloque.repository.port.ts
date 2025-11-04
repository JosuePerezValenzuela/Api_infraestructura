import { CreateBloqueCommand } from './commands/create-bloque.command';
import { ListBloquesOptions, ListBloquesResult } from './bloque.list.types';

export const BloqueRepositoryPort = Symbol('BloqueRepositoryPort');

export interface BloqueRepositoryPort {
  create(command: CreateBloqueCommand): Promise<{ id: number }>;

  isCodeTaken(codigo: string): Promise<boolean>;

  list(options: ListBloquesOptions): Promise<ListBloquesResult>;
}

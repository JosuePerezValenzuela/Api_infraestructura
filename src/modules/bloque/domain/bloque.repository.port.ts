import { CreateBloqueCommand } from './commands/create-bloque.command';

export const BloqueRepositoryPort = Symbol('BloqueRepositoryPort');

export interface BloqueRepositoryPort {
  create(commmand: CreateBloqueCommand): Promise<{ id: number }>;

  isCodeTaken(codigo: string): Promise<boolean>;
}

import { CreateTipoBloqueCommand } from './commands/create-tipo-bloque.command';

export const TipoBloqueRepositoryPort = Symbol('TipoBloqueRepositoryPort');

export interface TipoBloqueRepositoryPort {
  create(commnad: CreateTipoBloqueCommand): Promise<{ id: number }>;

  isNameTaken(nombre: string): Promise<boolean>;
}

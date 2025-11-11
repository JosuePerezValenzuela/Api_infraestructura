import { CreateTipoAmbienteCommand } from './commands/create-tipo-ambiente.command';

export const TipoAmbienteRepositoryPort = Symbol('TipoAmbienteRepositoryPort');

export interface TipoAmbienteRepositoryPort {
  create(command: CreateTipoAmbienteCommand): Promise<{ id: number }>;

  isNameTaken(nombre: string): Promise<boolean>;
}

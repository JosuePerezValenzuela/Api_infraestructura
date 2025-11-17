import { CreateAmbienteCommand } from './commands/create-ambiente.command';

export const AmbienteRepositoryPort = Symbol('AmbienteRepositoryPort');

export interface CreateAmbienteResult {
  id: number;
}

export interface AmbienteRepositoryPort {
  create(command: CreateAmbienteCommand): Promise<CreateAmbienteResult>;

  isCodeTaken(codigo: string, excludeId?: number): Promise<boolean>;
}

import {
  ListAmbientesDisponiblesQuery,
  ListAmbientesDisponiblesResult,
} from './ambiente.disponibles.types';

export const AmbientesDisponiblesRepositoryPort = Symbol(
  'AmbientesDisponiblesRepositoryPort',
);

export interface AmbientesDisponiblesRepositoryPort {
  listDisponibles(
    query: ListAmbientesDisponiblesQuery,
  ): Promise<ListAmbientesDisponiblesResult>;
}

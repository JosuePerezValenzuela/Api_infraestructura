// En este archivo escribimos las pruebas del caso de uso DeleteBloqueUseCase y explicamos cada paso para que cualquier persona aprenda cómo aplicamos TDD.
// IMPORTANTE: primero generamos las pruebas (rojas) y recién después implementaremos la lógica.

import { NotFoundException } from '@nestjs/common';
import { DeleteBloqueUseCase } from './delete-bloque.usecase';
import type { BloqueRepositoryPort } from '../domain/bloque.repository.port';
import type { RelationshipsPort } from '../../_shared/relationships/domain/relationships.port';

// Definimos la estructura del mock del repositorio de bloques para tener autocompletado en las pruebas.
interface FakeBloqueRepositoryPort {
  findById: jest.Mock<Promise<{ id: number } | null>, [number]>;
  delete: jest.Mock<Promise<void>, [number]>;
}

// También mockeamos el RelationshipsPort para asegurarnos de que disparamos la cascada de eliminación.
interface FakeRelationshipsPort {
  deleteBloqueCascade: jest.Mock<Promise<void>, [number]>;
}

describe('DeleteBloqueUseCase', () => {
  // Función de ayuda que arma el sistema bajo prueba (SUT) con mocks frescos en cada escenario.
  const buildSystem = () => {
    const bloqueRepo: FakeBloqueRepositoryPort = {
      findById: jest.fn(),
      delete: jest.fn(),
    };

    const relationships: FakeRelationshipsPort = {
      deleteBloqueCascade: jest.fn(),
    };

    const useCase = new (DeleteBloqueUseCase as any)(
      bloqueRepo as unknown as BloqueRepositoryPort,
      relationships as unknown as RelationshipsPort,
    );

    return { useCase, bloqueRepo, relationships };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lanza NotFoundException cuando el bloque no existe', async () => {
    const { useCase, bloqueRepo, relationships } = buildSystem();
    bloqueRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute({ id: 999 })).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(relationships.deleteBloqueCascade).not.toHaveBeenCalled();
    expect(bloqueRepo.delete).not.toHaveBeenCalled();
  });
});

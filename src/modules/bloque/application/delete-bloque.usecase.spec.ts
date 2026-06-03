// Pruebas del caso de uso DeleteBloqueUseCase.

import { ConflictException, NotFoundException } from '@nestjs/common';
import { DeleteBloqueUseCase } from './delete-bloque.usecase';
import type {
  BloqueRepositoryPort,
  RelatedAmbiente,
} from '../domain/bloque.repository.port';

interface FakeBloqueRepositoryPort {
  findById: jest.Mock<Promise<{ id: number; codigo: string } | null>, [number]>;
  findRelatedAmbientes: jest.Mock<Promise<RelatedAmbiente[]>, [number]>;
  delete: jest.Mock<Promise<{ id: number }>, [number]>;
}

describe('DeleteBloqueUseCase', () => {
  const buildSystem = () => {
    const bloqueRepo: FakeBloqueRepositoryPort = {
      findById: jest.fn(),
      findRelatedAmbientes: jest.fn(),
      delete: jest.fn(),
    };

    const useCase = new (DeleteBloqueUseCase as any)(
      bloqueRepo as unknown as BloqueRepositoryPort,
    );

    return { useCase, bloqueRepo };
  };

  // Flujo feliz: el bloque existe, no tiene ambientes dependientes y se elimina
  it('elimina el bloque cuando existe y no tiene ambientes dependientes', async () => {
    const { useCase, bloqueRepo } = buildSystem();

    bloqueRepo.findById.mockResolvedValue({ id: 1, codigo: 'BLOQ-01' });
    bloqueRepo.findRelatedAmbientes.mockResolvedValue([]);
    bloqueRepo.delete.mockResolvedValue({ id: 1 });

    const result = await useCase.execute({ id: 1 });

    expect(result).toEqual({ id: 1 });
    expect(bloqueRepo.findById).toHaveBeenCalledWith(1);
    expect(bloqueRepo.findRelatedAmbientes).toHaveBeenCalledWith(1);
    expect(bloqueRepo.delete).toHaveBeenCalledWith(1);
  });

  // NotFoundException cuando el bloque no existe
  it('lanza NotFoundException cuando el bloque no existe', async () => {
    const { useCase, bloqueRepo } = buildSystem();

    bloqueRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute({ id: 999 })).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(bloqueRepo.findRelatedAmbientes).not.toHaveBeenCalled();
    expect(bloqueRepo.delete).not.toHaveBeenCalled();
  });

  // ConflictException cuando hay ambientes dependientes
  it('lanza ConflictException cuando hay ambientes dependientes', async () => {
    const { useCase, bloqueRepo } = buildSystem();

    bloqueRepo.findById.mockResolvedValue({ id: 1, codigo: 'BLOQ-01' });

    const relatedAmbientes: RelatedAmbiente[] = [
      {
        id: 1,
        codigo: 'AUL-101',
        nombre: 'Aula 101',
        nombre_corto: 'A101',
        tipo_ambiente_nombre: 'Aula',
        activo: true,
      },
      {
        id: 2,
        codigo: 'LAB-01',
        nombre: 'Laboratorio 1',
        nombre_corto: 'L1',
        tipo_ambiente_nombre: 'Laboratorio',
        activo: true,
      },
    ];
    bloqueRepo.findRelatedAmbientes.mockResolvedValue(relatedAmbientes);

    await expect(useCase.execute({ id: 1 })).rejects.toBeInstanceOf(
      ConflictException,
    );

    // Verificamos el formato del error
    const error = await useCase.execute({ id: 1 }).catch((e) => e);
    const response = error.getResponse() as any;
    expect(response.error).toBe('CONFLICT_ERROR');
    expect(response.message).toBe(
      'No se puede eliminar el bloque porque tiene ambientes dependientes',
    );
    expect(response.details).toHaveLength(2);
    expect(response.details[0].ambiente.id).toBe(1);
    expect(response.details[1].ambiente.id).toBe(2);

    expect(bloqueRepo.delete).not.toHaveBeenCalled();
  });

  // Propaga error cuando delete falla
  it('propaga el error cuando delete falla', async () => {
    const { useCase, bloqueRepo } = buildSystem();

    bloqueRepo.findById.mockResolvedValue({ id: 1, codigo: 'BLOQ-01' });
    bloqueRepo.findRelatedAmbientes.mockResolvedValue([]);

    const failure = new Error('Fallo en la base de datos');
    bloqueRepo.delete.mockRejectedValue(failure);

    await expect(useCase.execute({ id: 1 })).rejects.toThrow(failure);
  });
});

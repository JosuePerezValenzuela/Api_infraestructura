// En este archivo enseñamos paso a paso el comportamiento esperado de DeleteAmbienteUseCase para que cualquiera pueda seguirlo.
import { Injectable, NotFoundException } from '@nestjs/common';
import { DeleteAmbienteUseCase } from './delete-ambiente.usecase';
import { AmbienteRepositoryPort } from '../domain/ambiente.repository.port';

interface DeleteCommand {
  id: number;
}

interface AmbienteRepositoryMock extends AmbienteRepositoryPort {
  findById: jest.Mock<Promise<{ id: number } | null>, [number]>;
  delete: jest.Mock<Promise<{ id: number }>, [DeleteCommand]>;
  deleteAssets: jest.Mock<Promise<void>, [number]>;
}

@Injectable()
class FakeDeleteAmbienteUseCase extends DeleteAmbienteUseCase {}

describe('DeleteAmbienteUseCase', () => {
  const buildSystem = () => {
    const repo: AmbienteRepositoryMock = {
      create: jest.fn(),
      isCodeTaken: jest.fn(),
      list: jest.fn(),
      findById: jest.fn().mockResolvedValue({ id: 10 }),
      delete: jest.fn().mockResolvedValue({ id: 10 }),
      deleteAssets: jest.fn().mockResolvedValue(undefined),
    };

    const useCase = new FakeDeleteAmbienteUseCase(
      repo as unknown as AmbienteRepositoryPort,
    );

    return { useCase, repo };
  };

  it('elimina un ambiente cuando existe y limpia sus activos primero', async () => {
    const { useCase, repo } = buildSystem();

    const result = await useCase.execute({ id: 10 });

    expect(repo.findById).toHaveBeenCalledWith(10);
    expect(repo.deleteAssets).toHaveBeenCalledWith(10);
    expect(repo.delete).toHaveBeenCalledWith({ id: 10 });
    expect(result).toEqual({ id: 10 });
  });

  it('lanza NotFoundException cuando el ambiente no existe', async () => {
    const { useCase, repo } = buildSystem();
    repo.findById.mockResolvedValueOnce(null);

    await expect(useCase.execute({ id: 999 })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repo.delete).not.toHaveBeenCalled();
    expect(repo.deleteAssets).not.toHaveBeenCalled();
  });
});

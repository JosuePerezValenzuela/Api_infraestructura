// Pruebas del caso de uso DeleteAmbienteUseCase.
import { NotFoundException } from '@nestjs/common';
import { DeleteAmbienteUseCase } from './delete-ambiente.usecase';
import { AmbienteRepositoryPort } from '../domain/ambiente.repository.port';
import { HorarioRepositoryPort } from '../domain/horario.repository.port';

interface DeleteCommand {
  id: number;
}

interface AmbienteRepositoryMock extends AmbienteRepositoryPort {
  findById: jest.Mock<Promise<{ id: number } | null>, [number]>;
  delete: jest.Mock<Promise<{ id: number }>, [DeleteCommand]>;
  deleteAssets: jest.Mock<Promise<void>, [number]>;
}

interface HorarioRepositoryMock extends HorarioRepositoryPort {
  deleteByAmbienteId: jest.Mock<Promise<void>, [number]>;
}

describe('DeleteAmbienteUseCase', () => {
  const buildSystem = () => {
    const repo: AmbienteRepositoryMock = {
      create: jest.fn(),
      isCodeTaken: jest.fn(),
      list: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn(),
      deleteAssets: jest.fn(),
      findByIdWithRelations: jest.fn(),
      update: jest.fn(),
    };

    const horarioRepo: HorarioRepositoryMock = {
      findByAmbienteId: jest.fn(),
      replaceForAmbiente: jest.fn(),
      listByAmbiente: jest.fn(),
      deleteByAmbienteId: jest.fn(),
    };

    const useCase = new (DeleteAmbienteUseCase as any)(
      repo as unknown as AmbienteRepositoryPort,
      horarioRepo as unknown as HorarioRepositoryPort,
    );

    return { useCase, repo, horarioRepo };
  };

  // Flujo feliz: elimina el ambiente y todo lo relacionado
  it('elimina el ambiente y todo lo relacionado (horarios, activos)', async () => {
    const { useCase, repo, horarioRepo } = buildSystem();

    repo.findById.mockResolvedValue({ id: 10 });
    horarioRepo.deleteByAmbienteId.mockResolvedValue(undefined);
    repo.deleteAssets.mockResolvedValue(undefined);
    repo.delete.mockResolvedValue({ id: 10 });

    const result = await useCase.execute({ id: 10 });

    expect(result).toEqual({ id: 10 });
    expect(repo.findById).toHaveBeenCalledWith(10);
    expect(horarioRepo.deleteByAmbienteId).toHaveBeenCalledWith(10);
    expect(repo.deleteAssets).toHaveBeenCalledWith(10);
    expect(repo.delete).toHaveBeenCalledWith({ id: 10 });
  });

  // NotFoundException cuando el ambiente no existe
  it('lanza NotFoundException cuando el ambiente no existe', async () => {
    const { useCase, repo, horarioRepo } = buildSystem();

    repo.findById.mockResolvedValue(null);

    await expect(useCase.execute({ id: 999 })).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(horarioRepo.deleteByAmbienteId).not.toHaveBeenCalled();
    expect(repo.deleteAssets).not.toHaveBeenCalled();
    expect(repo.delete).not.toHaveBeenCalled();
  });

  // Propaga error cuando delete falla
  it('propaga el error cuando delete falla', async () => {
    const { useCase, repo, horarioRepo } = buildSystem();

    repo.findById.mockResolvedValue({ id: 10 });
    horarioRepo.deleteByAmbienteId.mockResolvedValue(undefined);
    repo.deleteAssets.mockResolvedValue(undefined);

    const failure = new Error('Fallo en la base de datos');
    repo.delete.mockRejectedValue(failure);

    await expect(useCase.execute({ id: 10 })).rejects.toThrow(failure);
  });
});

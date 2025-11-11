// En estas pruebas describimos el comportamiento del DeleteTipoAmbienteUseCase con comentarios educativos.
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DeleteTipoAmbienteUseCase } from './delete-tipo-ambiente.usecase';
import { TipoAmbienteRepositoryPort } from '../domain/tipo-ambiente.repository.port';

type DeleteRepoMock = {
  delete: jest.Mock<Promise<{ id: number }>, [{ id: number }]>;
};

describe('DeleteTipoAmbienteUseCase', () => {
  const buildSystem = () => {
    const repo: DeleteRepoMock = {
      delete: jest.fn().mockResolvedValue({ id: 10 }),
    };
    const useCase = new DeleteTipoAmbienteUseCase(
      repo as unknown as TipoAmbienteRepositoryPort,
    );
    return { repo, useCase };
  };

  it('elimina un tipo de ambiente cuando el id es válido', async () => {
    const { repo, useCase } = buildSystem();

    const result = await useCase.execute({ id: 10 });

    expect(repo.delete).toHaveBeenCalledWith({ id: 10 });
    expect(result).toEqual({ id: 10 });
  });

  it('lanza BadRequestException cuando el id es menor a 1', async () => {
    const { repo, useCase } = buildSystem();

    await expect(useCase.execute({ id: 0 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(repo.delete).not.toHaveBeenCalled();
  });

  it('propaga NotFoundException cuando el repositorio notifica que no existe', async () => {
    const { repo, useCase } = buildSystem();
    repo.delete.mockRejectedValue(
      new NotFoundException('No se encontró el tipo de ambiente'),
    );

    await expect(useCase.execute({ id: 9999 })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

// En este archivo describimos con detalle cГіmo debe comportarse DeleteActivoUseCase.
// Cada prueba tiene comentarios cortos para que alguien sin experiencia siga el flujo.

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DeleteActivoUseCase } from './delete-activo.usecase';
import { ActivoRepositoryPort } from '../domain/activo.repository.port';
import { DeleteActivoCommand } from '../domain/commands/delete-activo.command';

// Repositorio falso con los mГ©todos que usa el caso de uso.
type FakeActivoRepository = {
  findById: jest.Mock<Promise<{ id: number } | null>, [number]>;
  delete: jest.Mock<Promise<{ id: number }>, [DeleteActivoCommand]>;
};

describe('DeleteActivoUseCase', () => {
  // Construimos el sistema bajo prueba con mocks nuevos en cada test.
  const buildSystem = () => {
    const repo: FakeActivoRepository = {
      findById: jest.fn(),
      delete: jest.fn(),
    };
    const useCase = new DeleteActivoUseCase(
      repo as unknown as ActivoRepositoryPort,
    );
    return { repo, useCase };
  };

  it('elimina el activo cuando el id es vГЎlido y existe', async () => {
    // Arrange: simulamos que el activo existe y que el delete devuelve el mismo id.
    const { repo, useCase } = buildSystem();
    repo.findById.mockResolvedValue({ id: 7 });
    repo.delete.mockResolvedValue({ id: 7 });

    // Act: ejecutamos el caso de uso con id=7.
    const result = await useCase.execute({ id: 7 });

    // Assert: verifica que busquemos primero y luego eliminemos.
    expect(repo.findById).toHaveBeenCalledWith(7);
    expect(repo.delete).toHaveBeenCalledWith({ id: 7 });
    expect(result).toEqual({ id: 7 });
  });

  it('lanza BadRequestException cuando el id es menor a 1', async () => {
    // Arrange: construimos el caso de uso.
    const { repo, useCase } = buildSystem();

    // Act & Assert: id=0 es invГЎlido, no debe llamar al repo.
    await expect(useCase.execute({ id: 0 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(repo.findById).not.toHaveBeenCalled();
    expect(repo.delete).not.toHaveBeenCalled();
  });

  it('lanza NotFoundException cuando el activo no existe', async () => {
    // Arrange: simulamos que findById no encuentra nada.
    const { repo, useCase } = buildSystem();
    repo.findById.mockResolvedValue(null);

    // Act & Assert: debe rechazar con NotFoundException.
    await expect(useCase.execute({ id: 999 })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    // No deberГ­a intentar eliminar si no existe.
    expect(repo.delete).not.toHaveBeenCalled();
  });
});

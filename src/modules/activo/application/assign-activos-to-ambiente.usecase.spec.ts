// Esta suite explica paso a paso cÃ³mo asociar varios activos a un ambiente.
// Cada prueba incluye comentarios claros para que alguien sin experiencia entienda quÃ© se valida.

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AssignActivosToAmbienteUseCase } from './assign-activos-to-ambiente.usecase';
import { ActivoRepositoryPort } from '../domain/activo.repository.port';
import { AmbienteRepositoryPort } from '../../ambiente/domain/ambiente.repository.port';

// Tipos de los mocks usados en las pruebas.
type FakeActivoRepo = {
  assignToAmbiente: jest.Mock<Promise<{ updatedIds: number[] }>, [number, number[]]>;
};

type FakeAmbienteRepo = {
  findById: jest.Mock<Promise<{ id: number } | null>, [number]>;
};

describe('AssignActivosToAmbienteUseCase', () => {
  // Funcion auxiliar para armar el sistema con repos falsos.
  const buildSystem = () => {
    const activoRepo: FakeActivoRepo = {
      assignToAmbiente: jest.fn(),
    };
    const ambienteRepo: FakeAmbienteRepo = {
      findById: jest.fn(),
    };
    const useCase = new AssignActivosToAmbienteUseCase(
      activoRepo as unknown as ActivoRepositoryPort,
      ambienteRepo as unknown as AmbienteRepositoryPort,
    );
    return { useCase, activoRepo, ambienteRepo };
  };

  it('asocia todos los activos cuando los datos son vÃ¡lidos', async () => {
    // Arrange: el ambiente existe y el repositorio actualiza todos los ids.
    const { useCase, activoRepo, ambienteRepo } = buildSystem();
    ambienteRepo.findById.mockResolvedValue({ id: 10 });
    activoRepo.assignToAmbiente.mockResolvedValue({ updatedIds: [1, 2, 3] });

    // Act: ejecutamos con ambienteId=10 y tres activos.
    const result = await useCase.execute({ ambienteId: 10, activoIds: [1, 2, 3] });

    // Assert: se consultÃ³ el ambiente y se mandaron los ids normalizados (Ãºnicos).
    expect(ambienteRepo.findById).toHaveBeenCalledWith(10);
    expect(activoRepo.assignToAmbiente).toHaveBeenCalledWith(10, [1, 2, 3]);
    expect(result).toEqual({ updatedIds: [1, 2, 3] });
  });

  it('lanza BadRequestException cuando el ambienteId es invÃ¡lido', async () => {
    const { useCase, activoRepo, ambienteRepo } = buildSystem();
    await expect(
      useCase.execute({ ambienteId: 0, activoIds: [1] }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(ambienteRepo.findById).not.toHaveBeenCalled();
    expect(activoRepo.assignToAmbiente).not.toHaveBeenCalled();
  });

  it('lanza BadRequestException cuando la lista de activos estÃ¡ vacÃ­a o contiene ids no enteros', async () => {
    const { useCase } = buildSystem();
    await expect(
      useCase.execute({ ambienteId: 1, activoIds: [] }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      useCase.execute({ ambienteId: 1, activoIds: [1, -2] }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lanza NotFoundException cuando el ambiente no existe', async () => {
    const { useCase, ambienteRepo } = buildSystem();
    ambienteRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ ambienteId: 99, activoIds: [1, 2] }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lanza NotFoundException si no se actualizan todos los activos solicitados', async () => {
    // Arrange: solo se actualizarÃ¡ 1 id de los 2 solicitados.
    const { useCase, activoRepo, ambienteRepo } = buildSystem();
    ambienteRepo.findById.mockResolvedValue({ id: 5 });
    activoRepo.assignToAmbiente.mockResolvedValue({ updatedIds: [7] });

    // Act & Assert.
    await expect(
      useCase.execute({ ambienteId: 5, activoIds: [7, 8] }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

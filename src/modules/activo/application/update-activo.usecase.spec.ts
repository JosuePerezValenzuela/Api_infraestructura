// Esta suite explica paso a paso el comportamiento esperado de UpdateActivoUseCase.
// Los comentarios estГЎn pensados para que una persona sin experiencia comprenda cada verificaciГіn.

import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { UpdateActivoUseCase } from './update-activo.usecase';
import { ActivoRepositoryPort } from '../domain/activo.repository.port';
import { UpdateActivoCommand } from '../domain/commands/update-activo.command';

// Definimos el repositorio falso con los mГ©todos que usa el caso de uso.
type FakeActivoRepository = {
  findById: jest.Mock<Promise<{ id: number } | null>, [number]>;
  update: jest.Mock<Promise<{ id: number }>, [UpdateActivoCommand]>;
  isNiaTaken: jest.Mock<Promise<boolean>, [string, number | undefined]>;
};

describe('UpdateActivoUseCase', () => {
  // Funcion auxiliar para armar el sistema de pruebas.
  const buildSystem = () => {
    const repo: FakeActivoRepository = {
      findById: jest.fn(),
      update: jest.fn(),
      isNiaTaken: jest.fn(),
    };
    const useCase = new UpdateActivoUseCase(
      repo as unknown as ActivoRepositoryPort,
    );
    return { repo, useCase };
  };

  it('actualiza el activo cuando los datos son validos', async () => {
    // Arrange: simulamos que el activo existe y que el NIA no estГЎ tomado por otro.
    const { repo, useCase } = buildSystem();
    repo.findById.mockResolvedValue({ id: 5 });
    repo.isNiaTaken.mockResolvedValue(false);
    repo.update.mockResolvedValue({ id: 5 });

    // Payload con espacios para probar la normalizaciГіn.
    const input = {
      id: 5,
      nia: '  NIA-200  ',
      nombre: '  Router Cisco  ',
      descripcion: '  Equipo de red  ',
      ambiente_id: 8,
    };

    // Act: ejecutamos el caso de uso.
    const result = await useCase.execute(input);

    // Assert: verificamos llamadas con valores ya recortados.
    expect(repo.findById).toHaveBeenCalledWith(5);
    expect(repo.isNiaTaken).toHaveBeenCalledWith('NIA-200', 5);
    expect(repo.update).toHaveBeenCalledWith({
      id: 5,
      nia: 'NIA-200',
      nombre: 'Router Cisco',
      descripcion: 'Equipo de red',
      ambiente_id: 8,
    });
    expect(result).toEqual({ id: 5 });
  });

  it('lanza BadRequestException cuando el id es menor a 1', async () => {
    // Arrange: construimos el caso de uso.
    const { repo, useCase } = buildSystem();

    // Act & Assert: id=0 es invalido; no debe llamar al repositorio.
    await expect(
      useCase.execute({ id: 0, nombre: 'Algo' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.findById).not.toHaveBeenCalled();
  });

  it('lanza BadRequestException cuando no se envia ningun campo para actualizar', async () => {
    // Arrange: sistema de prueba.
    const { repo, useCase } = buildSystem();
    repo.findById.mockResolvedValue({ id: 3 });

    // Act & Assert: payload vacio debe fallar.
    await expect(useCase.execute({ id: 3 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('lanza BadRequestException cuando el nombre es vacio o demasiado largo', async () => {
    const { repo, useCase } = buildSystem();
    repo.findById.mockResolvedValue({ id: 4 });

    await expect(
      useCase.execute({ id: 4, nombre: '   ' }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      useCase.execute({ id: 4, nombre: 'X'.repeat(33) }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lanza BadRequestException cuando la descripcion supera 128 caracteres', async () => {
    const { repo, useCase } = buildSystem();
    repo.findById.mockResolvedValue({ id: 6 });
    const longDesc = 'D'.repeat(129);

    await expect(
      useCase.execute({ id: 6, descripcion: longDesc }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lanza BadRequestException cuando ambiente_id no es entero positivo', async () => {
    const { repo, useCase } = buildSystem();
    repo.findById.mockResolvedValue({ id: 7 });

    await expect(
      useCase.execute({ id: 7, ambiente_id: 0 }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      useCase.execute({ id: 7, ambiente_id: 1.5 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lanza ConflictException cuando el NIA ya existe en otro activo', async () => {
    // Arrange: el activo existe pero el NIA propuesto esta ocupado.
    const { repo, useCase } = buildSystem();
    repo.findById.mockResolvedValue({ id: 8 });
    repo.isNiaTaken.mockResolvedValue(true);

    // Act & Assert: debe rechazar por conflicto y no llamar a update.
    await expect(
      useCase.execute({ id: 8, nia: 'NIA-1' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('lanza NotFoundException cuando el activo no existe', async () => {
    // Arrange: simulamos que findById devuelve null.
    const { repo, useCase } = buildSystem();
    repo.findById.mockResolvedValue(null);

    // Act & Assert: debe rechazar con NotFoundException.
    await expect(
      useCase.execute({ id: 999, nombre: 'Algo' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repo.update).not.toHaveBeenCalled();
  });
});

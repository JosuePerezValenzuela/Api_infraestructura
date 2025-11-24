// Esta suite explica paso a paso c贸mo debe comportarse CreateActivoUseCase.
// Cada l铆nea tiene un comentario para que alguien sin experiencia pueda entender el flujo.

import { BadRequestException, ConflictException } from '@nestjs/common';
import { CreateActivoUseCase } from './create-activo.usecase';
import { CreateActivoCommand } from '../domain/commands/create-activo.command';
import { ActivoRepositoryPort } from '../domain/activo.repository.port';

// Definimos el tipo del repositorio falso que usaremos en las pruebas.
type FakeActivoRepository = {
  create: jest.Mock<Promise<{ id: number }>, [CreateActivoCommand]>;
  isNiaTaken: jest.Mock<Promise<boolean>, [string]>;
};

describe('CreateActivoUseCase', () => {
  // Función auxiliar para armar el sistema bajo prueba con un repo de mentira.
  const buildSystem = () => {
    // Creamos el mock del repositorio con jest.fn para espiar las llamadas.
    const repo: FakeActivoRepository = {
      create: jest.fn(),
      isNiaTaken: jest.fn(),
    };
    // Inyectamos el repo falso en el caso de uso real.
    const useCase = new CreateActivoUseCase(
      repo as unknown as ActivoRepositoryPort,
    );
    // Retornamos ambos para usarlos en cada prueba.
    return { useCase, repo };
  };

  it('crea un activo cuando los datos son válidos', async () => {
    // Arrange: armamos sistema y configuramos respuestas del repo.
    const { useCase, repo } = buildSystem();
    // El NIA no está tomado.
    repo.isNiaTaken.mockResolvedValue(false);
    // El create devolverá un id 10.
    repo.create.mockResolvedValue({ id: 10 });
    // Payload con espacios para verificar trim.
    const payload = {
      nia: '  NIA-9000  ',
      nombre: '  Router Cisco  ',
      descripcion: '  Equipo de red  ',
      ambiente_id: 5,
    };

    // Act: ejecutamos el caso de uso.
    const result = await useCase.execute(payload);

    // Assert: verificamos que isNiaTaken se llamó con el NIA normalizado.
    expect(repo.isNiaTaken).toHaveBeenCalledWith('NIA-9000');
    // El create debe recibir los datos limpios y con descripcion recortada.
    expect(repo.create).toHaveBeenCalledWith({
      nia: 'NIA-9000',
      nombre: 'Router Cisco',
      descripcion: 'Equipo de red',
      ambiente_id: 5,
    });
    // El resultado debe ser el id entregado por el repo.
    expect(result).toEqual({ id: 10 });
  });

  it('lanza BadRequestException cuando falta el NIA', async () => {
    // Arrange: armamos el caso de uso.
    const { useCase } = buildSystem();
    // Act & Assert: ejecutar sin nia debe fallar.
    await expect(
      useCase.execute({ nombre: 'Switch', ambiente_id: 2 } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lanza BadRequestException cuando el NIA supera 32 caracteres', async () => {
    // Arrange: armamos el caso de uso.
    const { useCase } = buildSystem();
    // Construimos un nia demasiado largo.
    const longNia = 'X'.repeat(33);
    // Act & Assert: debe fallar por longitud.
    await expect(
      useCase.execute({ nia: longNia, nombre: 'Switch' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lanza BadRequestException cuando el nombre es inválido', async () => {
    // Arrange: armamos el caso de uso.
    const { useCase } = buildSystem();
    // Act & Assert: nombre vacío no es aceptado.
    await expect(
      useCase.execute({ nia: 'NIA-1', nombre: '   ' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    // Act & Assert: nombre demasiado largo tampoco es aceptado.
    await expect(
      useCase.execute({ nia: 'NIA-2', nombre: 'Y'.repeat(33) }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lanza BadRequestException cuando la descripción supera 128 caracteres', async () => {
    // Arrange: armamos el caso de uso.
    const { useCase } = buildSystem();
    // Descripción de 129 caracteres.
    const longDesc = 'D'.repeat(129);
    // Act & Assert: debe disparar el error de validación.
    await expect(
      useCase.execute({ nia: 'NIA-3', nombre: 'Mouse', descripcion: longDesc }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lanza BadRequestException cuando ambiente_id no es entero positivo', async () => {
    // Arrange: armamos el caso de uso.
    const { useCase } = buildSystem();
    // Act & Assert: ambiente_id=0 es inválido.
    await expect(
      useCase.execute({ nia: 'NIA-4', nombre: 'Monitor', ambiente_id: 0 }),
    ).rejects.toBeInstanceOf(BadRequestException);
    // Act & Assert: ambiente_id decimal también es inválido.
    await expect(
      useCase.execute({ nia: 'NIA-5', nombre: 'Monitor', ambiente_id: 1.5 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lanza ConflictException cuando el NIA ya existe', async () => {
    // Arrange: armamos sistema y configuramos isNiaTaken en true.
    const { useCase, repo } = buildSystem();
    repo.isNiaTaken.mockResolvedValue(true);
    // Act & Assert: debe rechazar por conflicto.
    await expect(
      useCase.execute({ nia: 'NIA-123', nombre: 'Laptop' }),
    ).rejects.toBeInstanceOf(ConflictException);
    // Confirmamos que no intenta crear cuando detecta duplicado.
    expect(repo.create).not.toHaveBeenCalled();
  });
});

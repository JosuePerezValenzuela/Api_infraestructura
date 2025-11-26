// Esta suite explica cГіmo debe comportarse el upsert de activos por NIA.
// Cada prueba tiene comentarios para que alguien sin experiencia entienda quГ© se verifica.
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UpsertActivoByNiaUseCase } from './upsert-activo-by-nia.usecase';
import { ActivoRepositoryPort } from '../domain/activo.repository.port';

type FakeRepo = {
  findByNia: jest.Mock<Promise<{ id: number } | null>, [string]>;
  create: jest.Mock<Promise<{ id: number }>, [any]>;
  update: jest.Mock<Promise<{ id: number }>, [any]>;
  existsAmbiente: jest.Mock<Promise<boolean>, [number]>;
};

describe('UpsertActivoByNiaUseCase', () => {
  const build = () => {
    // Creamos un repositorio falso que podamos controlar en cada prueba.
    const repo: FakeRepo = {
      findByNia: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      existsAmbiente: jest.fn(),
    };
    // Inyectamos el repo falso en el caso de uso real.
    const useCase = new UpsertActivoByNiaUseCase(
      repo as unknown as ActivoRepositoryPort,
    );
    return { repo, useCase };
  };

  it('crea el activo cuando la NIA no existe y devuelve created=true', async () => {
    // Arrange: la NIA no existe, el ambiente sГ­ existe y la BD devolverГЎ id 10.
    const { repo, useCase } = build();
    repo.findByNia.mockResolvedValue(null);
    repo.existsAmbiente.mockResolvedValue(true);
    repo.create.mockResolvedValue({ id: 10 });

    // Act: ejecutamos el upsert pasando los campos completos.
    const result = await useCase.execute({
      nia: ' NIA-123 ',
      nombre: ' Proyector ',
      descripcion: ' Sala A ',
      ambiente_id: 4,
    });

    // Assert: primero valida existencia de ambiente y luego inserta.
    expect(repo.existsAmbiente).toHaveBeenCalledWith(4);
    expect(repo.create).toHaveBeenCalledWith({
      nia: 'NIA-123',
      nombre: 'Proyector',
      descripcion: 'Sala A',
      ambiente_id: 4,
    });
    expect(result).toEqual({ id: 10, nia: 'NIA-123', created: true });
  });

  it('actualiza solo los campos enviados cuando la NIA ya existe', async () => {
    // Arrange: simulamos que ya hay un activo con esa NIA.
    const { repo, useCase } = build();
    repo.findByNia.mockResolvedValue({ id: 7 });
    repo.update.mockResolvedValue({ id: 7 });

    // Act: solo enviamos nombre y dejamos los demГЎs campos intactos.
    const result = await useCase.execute({
      nia: 'NIA-777',
      nombre: 'Router actualizado',
    });

    // Assert: se debe llamar a update con el id detectado y el campo presente.
    expect(repo.update).toHaveBeenCalledWith({
      id: 7,
      nombre: 'Router actualizado',
    });
    expect(result).toEqual({ id: 7, nia: 'NIA-777', created: false });
  });

  it('valida que haya al menos un campo cuando se intenta actualizar', async () => {
    // Arrange: la NIA ya existe pero no enviamos cambios.
    const { repo, useCase } = build();
    repo.findByNia.mockResolvedValue({ id: 5 });

    // Act & Assert: debe lanzar BadRequest por payload vacГ­o.
    await expect(useCase.execute({ nia: 'NIA-5' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('exige nombre cuando es una inserciГіn nueva', async () => {
    // Arrange: la NIA no existe y falta el nombre.
    const { repo, useCase } = build();
    repo.findByNia.mockResolvedValue(null);

    // Act & Assert: debe lanzar BadRequest porque nombre es obligatorio al crear.
    await expect(
      useCase.execute({ nia: 'NIA-9', descripcion: 'sin nombre' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lanza NotFound si el ambiente indicado no existe', async () => {
    // Arrange: insertaremos pero el ambiente no estГЎ en la BD.
    const { repo, useCase } = build();
    repo.findByNia.mockResolvedValue(null);
    repo.existsAmbiente.mockResolvedValue(false);

    // Act & Assert: se espera NotFoundException.
    await expect(
      useCase.execute({
        nia: 'NIA-999',
        nombre: 'Laptop',
        ambiente_id: 99,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

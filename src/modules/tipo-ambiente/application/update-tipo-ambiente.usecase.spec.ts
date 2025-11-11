// Estas pruebas documentan el comportamiento del UpdateTipoAmbienteUseCase en lenguaje sencillo.
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { UpdateTipoAmbienteUseCase } from './update-tipo-ambiente.usecase';
import { TipoAmbienteRepositoryPort } from '../domain/tipo-ambiente.repository.port';

type RepoMock = {
  findById: jest.Mock<Promise<any>, [number]>;
  isNameTakenByOther: jest.Mock<Promise<boolean>, [string, number]>;
  update: jest.Mock<Promise<{ id: number }>, [any]>;
};

describe('UpdateTipoAmbienteUseCase', () => {
  const buildSystem = () => {
    const repo: RepoMock = {
      findById: jest.fn().mockResolvedValue({
        id: 5,
        nombre: 'Laboratorio',
        descripcion: 'Espacio científico',
        descripcion_corta: 'Lab',
        activo: true,
        creado_en: new Date(),
        actualizado_en: new Date(),
      }),
      isNameTakenByOther: jest.fn().mockResolvedValue(false),
      update: jest.fn().mockResolvedValue({ id: 5 }),
    };

    const useCase = new UpdateTipoAmbienteUseCase(
      repo as unknown as TipoAmbienteRepositoryPort,
    );

    return { repo, useCase };
  };

  it('actualiza los campos enviados cuando son válidos', async () => {
    const { repo, useCase } = buildSystem();

    const result = await useCase.execute({
      id: 5,
      nombre: ' Laboratorio Clínico ',
      descripcion_corta: '  Lab clínico ',
      activo: false,
    });

    expect(repo.findById).toHaveBeenCalledWith(5);
    expect(repo.isNameTakenByOther).toHaveBeenCalledWith(
      'Laboratorio Clínico',
      5,
    );
    expect(repo.update).toHaveBeenCalledWith({
      id: 5,
      nombre: 'Laboratorio Clínico',
      descripcion_corta: 'Lab clínico',
      activo: false,
    });
    expect(result).toEqual({ id: 5 });
  });

  it('lanza BadRequestException cuando no hay campos para actualizar', async () => {
    const { repo, useCase } = buildSystem();

    await expect(useCase.execute({ id: 5 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('lanza BadRequestException cuando el id es inválido', async () => {
    const { repo, useCase } = buildSystem();

    await expect(
      useCase.execute({ id: 0, nombre: 'Nueva' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.findById).not.toHaveBeenCalled();
  });

  it('lanza NotFoundException cuando el tipo de ambiente no existe', async () => {
    const { repo, useCase } = buildSystem();
    repo.findById.mockResolvedValueOnce(null);

    await expect(
      useCase.execute({ id: 999, nombre: 'Inexistente' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('lanza ConflictException cuando el nombre pertenece a otro registro', async () => {
    const { repo, useCase } = buildSystem();
    repo.isNameTakenByOther.mockResolvedValueOnce(true);

    await expect(
      useCase.execute({ id: 5, nombre: 'Duplicado' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('lanza BadRequestException cuando la descripción excede el límite', async () => {
    const { repo, useCase } = buildSystem();

    await expect(
      useCase.execute({ id: 5, descripcion: 'x'.repeat(300) }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.update).not.toHaveBeenCalled();
  });
});

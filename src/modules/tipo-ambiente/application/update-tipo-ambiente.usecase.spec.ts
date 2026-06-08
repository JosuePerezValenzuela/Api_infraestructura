// Estas pruebas documentan el comportamiento del UpdateTipoAmbienteUseCase en lenguaje sencillo.
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { UpdateTipoAmbienteUseCase } from './update-tipo-ambiente.usecase';
import { TipoAmbienteRepositoryPort } from '../domain/tipo-ambiente.repository.port';
import { CacheService } from '../../_shared/infrastructure/cache/cache.service';

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

    const cache = {
      getOrSet: jest.fn().mockResolvedValue(undefined),
      invalidate: jest.fn().mockResolvedValue(undefined),
      invalidateNamespace: jest.fn().mockResolvedValue(undefined),
    } as unknown as CacheService;

    const useCase = new UpdateTipoAmbienteUseCase(
      repo as unknown as TipoAmbienteRepositoryPort,
      cache,
    );

    return { repo, useCase, cache };
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

  // ── Cache invalidation tests ───────────────────────────────────

  it('llama invalidateNamespace despues de actualizar exitosamente', async () => {
    const { useCase, cache, repo } = buildSystem();

    await useCase.execute({
      id: 5,
      nombre: 'Laboratorio renovado',
    });

    expect(repo.update).toHaveBeenCalled();
    expect(cache.invalidateNamespace).toHaveBeenCalledWith('tipo_ambiente:*');
  });

  it('NO llama invalidateNamespace cuando la validacion falla', async () => {
    const { useCase, cache } = buildSystem();

    await expect(
      useCase.execute({ id: 5, nombre: '   ' }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(cache.invalidateNamespace).not.toHaveBeenCalled();
  });

  it('NO llama invalidateNamespace cuando repo.update lanza error', async () => {
    const { useCase, cache, repo } = buildSystem();
    const error = new Error('DB error');
    repo.update.mockRejectedValue(error);

    await expect(
      useCase.execute({ id: 5, nombre: 'Nuevo nombre' }),
    ).rejects.toBe(error);

    expect(cache.invalidateNamespace).not.toHaveBeenCalled();
  });
});

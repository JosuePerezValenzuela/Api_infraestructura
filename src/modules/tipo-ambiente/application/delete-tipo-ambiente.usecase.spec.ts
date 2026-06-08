// En estas pruebas describimos el comportamiento del DeleteTipoAmbienteUseCase con comentarios educativos.
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DeleteTipoAmbienteUseCase } from './delete-tipo-ambiente.usecase';
import { TipoAmbienteRepositoryPort } from '../domain/tipo-ambiente.repository.port';
import { CacheService } from '../../_shared/infrastructure/cache/cache.service';

type DeleteRepoMock = {
  findById: jest.Mock<Promise<any | null>, [number]>;
  findRelatedAmbientes: jest.Mock<Promise<any[]>, [number]>;
  delete: jest.Mock<Promise<{ id: number }>, [number]>;
};

const defaultExisting = {
  id: 10,
  nombre: 'Laboratorio',
  descripcion: 'Espacio cientifico',
  descripcion_corta: 'Lab',
  activo: true,
  creado_en: new Date(),
  actualizado_en: new Date(),
};

describe('DeleteTipoAmbienteUseCase', () => {
  const buildSystem = (options?: { existing?: any | null }) => {
    const hasExisting = options ? 'existing' in options : false;
    const existing = hasExisting
      ? (options!.existing ?? null)
      : defaultExisting;

    const repo: DeleteRepoMock = {
      findById: jest.fn().mockResolvedValue(existing),
      findRelatedAmbientes: jest.fn().mockResolvedValue([]),
      delete: jest
        .fn()
        .mockResolvedValue({ id: (existing ?? defaultExisting).id }),
    };

    const cache = {
      getOrSet: jest.fn().mockResolvedValue(undefined),
      invalidate: jest.fn().mockResolvedValue(undefined),
      invalidateNamespace: jest.fn().mockResolvedValue(undefined),
    } as unknown as CacheService;

    const useCase = new DeleteTipoAmbienteUseCase(
      repo as unknown as TipoAmbienteRepositoryPort,
      cache,
    );
    return { repo, useCase, cache, existing: existing ?? defaultExisting };
  };

  it('elimina un tipo de ambiente cuando el id es válido', async () => {
    const { repo, useCase, existing } = buildSystem();

    const result = await useCase.execute({ id: existing.id });

    expect(repo.findById).toHaveBeenCalledWith(existing.id);
    expect(repo.findRelatedAmbientes).toHaveBeenCalledWith(existing.id);
    expect(repo.delete).toHaveBeenCalledWith(existing.id);
    expect(result).toEqual({ id: existing.id });
  });

  it('lanza BadRequestException cuando el id es menor a 1', async () => {
    const { repo, useCase } = buildSystem();

    await expect(useCase.execute({ id: 0 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(repo.findById).not.toHaveBeenCalled();
    expect(repo.delete).not.toHaveBeenCalled();
  });

  it('lanza NotFoundException cuando el tipo de ambiente no existe', async () => {
    const { repo, useCase } = buildSystem({ existing: null });

    await expect(useCase.execute({ id: 9999 })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repo.findById).toHaveBeenCalledWith(9999);
    expect(repo.delete).not.toHaveBeenCalled();
  });

  // ── Cache invalidation tests ───────────────────────────────────

  it('llama invalidateNamespace despues de eliminar exitosamente', async () => {
    const { useCase, cache, repo, existing } = buildSystem();

    await useCase.execute({ id: existing.id });

    expect(repo.delete).toHaveBeenCalledWith(existing.id);
    expect(cache.invalidateNamespace).toHaveBeenCalledWith('tipo_ambiente:*');
  });

  it('NO llama invalidateNamespace cuando el tipo de ambiente no existe', async () => {
    const { useCase, cache } = buildSystem({ existing: null });

    await expect(useCase.execute({ id: 999 })).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(cache.invalidateNamespace).not.toHaveBeenCalled();
  });

  it('NO llama invalidateNamespace cuando repo.delete lanza error', async () => {
    const { useCase, cache, repo, existing } = buildSystem();
    const error = new Error('DB error');
    repo.delete.mockRejectedValue(error);

    await expect(useCase.execute({ id: existing.id })).rejects.toBe(error);

    expect(cache.invalidateNamespace).not.toHaveBeenCalled();
  });
});

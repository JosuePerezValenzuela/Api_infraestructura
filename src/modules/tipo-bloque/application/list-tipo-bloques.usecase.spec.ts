// Esta suite documenta el comportamiento de ListTipoBloquesUseCase.
// Incluye comentarios sencillos para que cualquiera entienda las validaciones.

import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ListTipoBloquesUseCase } from './list-tipo-bloques.usecase';
import {
  ListTipoBloquesOptions,
  ListTipoBloquesResult,
} from '../domain/tipo-bloque.list.types';
import { TipoBloqueRepositoryPort } from '../domain/tipo-bloque.repository.port';
import { CacheService } from '../../_shared/infrastructure/cache/cache.service';

// Mock del repositorio para espiar las llamadas.
type FakeRepo = {
  list: jest.Mock<Promise<ListTipoBloquesResult>, [ListTipoBloquesOptions]>;
};

const dummyResult: ListTipoBloquesResult = {
  items: [],
  meta: {
    total: 0,
    page: 1,
    take: 6,
    pages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  },
};

const mockConfigService = {
  get: jest.fn().mockReturnValue(300),
};

const buildSystem = (overrides?: {
  cacheGetOrSetImpl?: (
    _key: string,
    _ttl: number,
    factory: () => Promise<ListTipoBloquesResult>,
  ) => Promise<ListTipoBloquesResult>;
}) => {
  const repo: FakeRepo = {
    list: jest.fn().mockResolvedValue({ ...dummyResult }),
  };

  const getOrSet = overrides?.cacheGetOrSetImpl
    ? jest.fn().mockImplementation(overrides.cacheGetOrSetImpl)
    : jest
        .fn()
        .mockImplementation(
          (
            _key: string,
            _ttl: number,
            factory: () => Promise<ListTipoBloquesResult>,
          ) => factory(),
        );

  const cache = {
    getOrSet,
    invalidate: jest.fn().mockResolvedValue(undefined),
    invalidateNamespace: jest.fn().mockResolvedValue(undefined),
  } as unknown as CacheService;

  const useCase = new ListTipoBloquesUseCase(
    repo as unknown as TipoBloqueRepositoryPort,
    cache,
    mockConfigService as unknown as ConfigService,
  );
  return { repo, useCase, cache };
};

describe('ListTipoBloquesUseCase', () => {
  // ── Existing behavior tests ────────────────────────────────────

  it('propaga el filtro activo cuando se envia', async () => {
    const { repo, useCase } = buildSystem();

    await useCase.execute({ page: 2, limit: 5, activo: true });

    expect(repo.list).toHaveBeenCalledWith({
      page: 2,
      take: 5,
      search: null,
      orderBy: 'nombre',
      orderDir: 'asc',
      activo: true,
    });
  });

  it('omite activo cuando no se envia', async () => {
    const { repo, useCase } = buildSystem();

    await useCase.execute({});

    expect(repo.list).toHaveBeenCalledWith({
      page: 1,
      take: 6,
      search: null,
      orderBy: 'nombre',
      orderDir: 'asc',
      activo: undefined,
    });
  });

  it('lanza BadRequest cuando activo no es booleano', async () => {
    const { useCase } = buildSystem();
    await expect(
      useCase.execute({ activo: 'yes' as any }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  // ── Cache behavior tests ───────────────────────────────────────

  it('llama getOrSet con key correcta que empieza por tipo_bloque:list:', async () => {
    const { useCase, cache } = buildSystem();

    await useCase.execute({ page: 1, limit: 6 });

    expect(cache.getOrSet).toHaveBeenCalledWith(
      expect.stringMatching(/^tipo_bloque:list:/),
      expect.any(Number),
      expect.any(Function),
    );
  });

  it('NO llama repo.list cuando cache entrega valor (cache hit)', async () => {
    const { repo, useCase } = buildSystem({
      cacheGetOrSetImpl: async () => ({ ...dummyResult }),
    });

    await useCase.execute({ page: 1, limit: 6 });

    expect(repo.list).not.toHaveBeenCalled();
  });

  it('llama repo.list cuando cache ejecuta factory (cache miss)', async () => {
    const { repo, useCase } = buildSystem();

    await useCase.execute({ page: 1, limit: 6 });

    expect(repo.list).toHaveBeenCalledTimes(1);
  });
});

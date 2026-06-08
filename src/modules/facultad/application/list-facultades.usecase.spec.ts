// Esta suite documenta el comportamiento de ListFacultadesUseCase con comentarios explicativos.
// Cada prueba muestra como se valida el filtro activo y como se propagan los argumentos.

import { BadRequestException, ConfigService } from '@nestjs/common';
import { ListFacultadesUseCase } from './list-facultades.usecase';
import { FacultadRepositoryPort } from '../domain/facultad.repository.port';
import { ListFacultadesQuery } from '../domain/facultad.list.types';
import { CacheService } from '../../_shared/infrastructure/cache/cache.service';

type FakeFacultadRepo = {
  findPaginated: jest.Mock<Promise<any>, [ListFacultadesQuery]>;
};

type ListFacultadesResult = {
  items: any[];
  meta: {
    total: number;
    page: number;
    take: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

const dummyResult: ListFacultadesResult = {
  items: [],
  meta: {
    total: 0,
    page: 1,
    take: 8,
    hasNextPage: false,
    hasPreviousPage: false,
  },
};

const mockConfigService = {
  get: jest.fn().mockReturnValue(300),
};

describe('ListFacultadesUseCase', () => {
  const buildSystem = (overrides?: {
    cacheGetOrSetImpl?: (
      _key: string,
      _ttl: number,
      factory: () => Promise<ListFacultadesResult>,
    ) => Promise<ListFacultadesResult>;
  }) => {
    const repo: FakeFacultadRepo = {
      findPaginated: jest.fn().mockResolvedValue({
        items: [],
        meta: {
          total: 0,
          page: 1,
          take: 8,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      }),
    };

    const getOrSet = overrides?.cacheGetOrSetImpl
      ? jest.fn().mockImplementation(overrides.cacheGetOrSetImpl)
      : jest
          .fn()
          .mockImplementation(
            (
              _key: string,
              _ttl: number,
              factory: () => Promise<ListFacultadesResult>,
            ) => factory(),
          );

    const cache = {
      getOrSet,
      invalidate: jest.fn().mockResolvedValue(undefined),
      invalidateNamespace: jest.fn().mockResolvedValue(undefined),
    } as unknown as CacheService;

    const useCase = new ListFacultadesUseCase(
      repo as unknown as FacultadRepositoryPort,
      cache,
      mockConfigService as unknown as ConfigService,
    );
    return { useCase, repo, cache };
  };

  it('propaga el filtro activo cuando se envia', async () => {
    const { useCase, repo } = buildSystem();

    await useCase.execute({ activo: true, page: 2, take: 5 });

    expect(repo.findPaginated).toHaveBeenCalledWith({
      page: 2,
      take: 5,
      search: null,
      orderBy: 'nombre',
      orderDir: 'asc',
      activo: true,
    });
  });

  it('omite activo cuando no se envia', async () => {
    const { useCase, repo } = buildSystem();

    await useCase.execute({});

    expect(repo.findPaginated).toHaveBeenCalledWith({
      page: 1,
      take: 8,
      search: null,
      orderBy: 'nombre',
      orderDir: 'asc',
      activo: undefined,
    });
  });

  it('lanza BadRequestException cuando orderBy no es permitido', async () => {
    const { useCase } = buildSystem();

    await expect(
      useCase.execute({ orderBy: 'otro' as any }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  // ── Cache behavior tests ───────────────────────────────────────

  it('llama getOrSet con key correcta que empieza por facultad:list:', async () => {
    const { useCase, cache } = buildSystem();

    await useCase.execute({ page: 1, take: 10 });

    expect(cache.getOrSet).toHaveBeenCalledWith(
      expect.stringMatching(/^facultad:list:/),
      expect.any(Number),
      expect.any(Function),
    );
  });

  it('NO llama repo.findPaginated cuando cache entrega valor (cache hit)', async () => {
    const { useCase, repo } = buildSystem({
      cacheGetOrSetImpl: async () => ({ ...dummyResult }),
    });

    await useCase.execute({ page: 1, take: 10 });

    expect(repo.findPaginated).not.toHaveBeenCalled();
  });

  it('llama repo.findPaginated cuando cache ejecuta factory (cache miss)', async () => {
    const { useCase, repo } = buildSystem();

    await useCase.execute({ page: 1, take: 10 });

    expect(repo.findPaginated).toHaveBeenCalledTimes(1);
  });
});

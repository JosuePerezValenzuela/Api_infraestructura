// En este archivo definimos las pruebas del caso de uso ListBloquesUseCase explicando cada paso con detalle pedagógico.
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ListBloquesUseCase } from './list-bloques.usecase';
import {
  BloqueListOrderBy,
  BloqueListOrderDir,
  ListBloquesOptions,
  ListBloquesResult,
} from '../domain/bloque.list.types';
import { CacheService } from '../../_shared/infrastructure/cache/cache.service';

// Creamos un tipo que describe el mock del repositorio, de modo que podamos espiar las llamadas fácilmente.
type BloqueRepositoryMock = {
  list: jest.Mock<Promise<ListBloquesResult>, [ListBloquesOptions]>;
};

const dummyResult: ListBloquesResult = {
  items: [],
  meta: {
    total: 0,
    page: 1,
    take: 6,
    hasNextPage: false,
    hasPreviousPage: false,
  },
};

const mockConfigService = {
  get: jest.fn().mockReturnValue(300),
};

// Helper que construye el sistema bajo prueba con un repositorio falso configurable.
const buildSystem = (overrides?: {
  cacheGetOrSetImpl?: (
    _key: string,
    _ttl: number,
    factory: () => Promise<ListBloquesResult>,
  ) => Promise<ListBloquesResult>;
}) => {
  const repo: BloqueRepositoryMock = {
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
            factory: () => Promise<ListBloquesResult>,
          ) => factory(),
        );

  const cache = {
    getOrSet,
    invalidate: jest.fn().mockResolvedValue(undefined),
    invalidateNamespace: jest.fn().mockResolvedValue(undefined),
  } as unknown as CacheService;

  const useCase = new ListBloquesUseCase(
    repo as unknown as any,
    cache,
    mockConfigService as unknown as ConfigService,
  );
  return { useCase, repo, cache };
};

describe('ListBloquesUseCase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('aplica valores por defecto cuando no se envian filtros', async () => {
    const { useCase, repo } = buildSystem();
    await useCase.execute({});
    expect(repo.list).toHaveBeenCalledWith({
      page: 1,
      take: 6,
      search: null,
      orderBy: 'nombre',
      orderDir: 'asc',
      facultadId: null,
      campusId: null,
      tipoBloqueId: null,
      activo: null,
      pisosMin: null,
      pisosMax: null,
    });
  });

  it('trimea la busqueda y valida los filtros opcionales', async () => {
    const { useCase, repo } = buildSystem();
    await useCase.execute({
      page: 2,
      limit: 5,
      search: '  Central  ',
      orderBy: 'codigo',
      orderDir: 'desc',
      facultadId: 4,
      tipoBloqueId: 1,
      activo: true,
      pisosMin: 2,
      pisosMax: 6,
    });
    expect(repo.list).toHaveBeenCalledWith({
      page: 2,
      take: 5,
      search: 'Central',
      orderBy: 'codigo',
      orderDir: 'desc',
      facultadId: 4,
      campusId: null,
      tipoBloqueId: 1,
      activo: true,
      pisosMin: 2,
      pisosMax: 6,
    });
  });

  it('lanza BadRequestException cuando la pagina es menor a 1', async () => {
    const { useCase } = buildSystem();
    await expect(useCase.execute({ page: 0 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('lanza BadRequestException cuando el limite supera 1000', async () => {
    const { useCase } = buildSystem();
    await expect(useCase.execute({ limit: 1001 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('lanza BadRequestException cuando orderBy no esta permitido', async () => {
    const { useCase } = buildSystem();
    await expect(
      useCase.execute({ orderBy: 'otro' as BloqueListOrderBy }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lanza BadRequestException cuando orderDir no esta permitido', async () => {
    const { useCase } = buildSystem();
    await expect(
      useCase.execute({ orderDir: 'up' as BloqueListOrderDir }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lanza BadRequestException cuando pisosMin es mayor que pisosMax', async () => {
    const { useCase } = buildSystem();
    await expect(
      useCase.execute({ pisosMin: 10, pisosMax: 5 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('calls getOrSet with a bloque:list key and configured TTL', async () => {
    const { useCase, cache } = buildSystem();

    await useCase.execute({ page: 1, limit: 6, facultadId: 3, campusId: 4 });

    expect(cache.getOrSet).toHaveBeenCalledWith(
      expect.stringMatching(/^bloque:list:/),
      300,
      expect.any(Function),
    );
    expect(mockConfigService.get).toHaveBeenCalledWith('CACHE_TTL', 300);
  });

  it('does not call repo.list when cache returns a cached value', async () => {
    const { useCase, repo } = buildSystem({
      cacheGetOrSetImpl: async () => ({ ...dummyResult }),
    });

    await useCase.execute({ page: 1, limit: 6, facultadId: 3 });

    expect(repo.list).not.toHaveBeenCalled();
  });

  it('calls repo.list when cache executes the factory', async () => {
    const { useCase, repo } = buildSystem();

    await useCase.execute({ page: 1, limit: 6, facultadId: 3 });

    expect(repo.list).toHaveBeenCalledTimes(1);
  });

  it('builds separate cache entries for different filter combinations', async () => {
    const { useCase, cache } = buildSystem();

    await useCase.execute({ page: 1, limit: 6, facultadId: 3 });
    await useCase.execute({ page: 1, limit: 6, facultadId: 4, campusId: 9 });

    const firstKey = (cache.getOrSet as jest.Mock).mock.calls[0][0] as string;
    const secondKey = (cache.getOrSet as jest.Mock).mock.calls[1][0] as string;

    expect(firstKey).not.toBe(secondKey);
    expect(firstKey).toContain('facultadId=3');
    expect(secondKey).toContain('facultadId=4');
    expect(secondKey).toContain('campusId=9');
  });

  it('re-fetches and recaches the bloque list after the cached entry expires', async () => {
    const cachedEntries = new Map<string, ListBloquesResult>();
    const expiredKeys = new Set<string>();
    const firstResult: ListBloquesResult = {
      items: [{ id: 1 } as never],
      meta: { ...dummyResult.meta, total: 1 },
    };
    const secondResult: ListBloquesResult = {
      items: [{ id: 2 } as never],
      meta: { ...dummyResult.meta, total: 2 },
    };

    const { useCase, repo, cache } = buildSystem({
      cacheGetOrSetImpl: async (
        key: string,
        _ttl: number,
        factory: () => Promise<ListBloquesResult>,
      ) => {
        const cachedValue = cachedEntries.get(key);

        if (cachedValue && !expiredKeys.has(key)) {
          return cachedValue;
        }

        const freshValue = await factory();
        cachedEntries.set(key, freshValue);
        expiredKeys.delete(key);
        return freshValue;
      },
    });

    repo.list
      .mockResolvedValueOnce(firstResult)
      .mockResolvedValueOnce(secondResult);

    const filters = { page: 1, limit: 6, facultadId: 3, campusId: 4 };

    await expect(useCase.execute(filters)).resolves.toEqual(firstResult);
    await expect(useCase.execute(filters)).resolves.toEqual(firstResult);

    const cacheKey = (cache.getOrSet as jest.Mock).mock.calls[0][0] as string;
    expiredKeys.add(cacheKey);

    await expect(useCase.execute(filters)).resolves.toEqual(secondResult);

    expect(repo.list).toHaveBeenCalledTimes(2);
    expect(cache.getOrSet).toHaveBeenNthCalledWith(
      3,
      cacheKey,
      300,
      expect.any(Function),
    );
  });

  it('falls through to repo.list when cache read fails', async () => {
    const { useCase, repo } = buildSystem({
      cacheGetOrSetImpl: async (
        _key: string,
        _ttl: number,
        factory: () => Promise<ListBloquesResult>,
      ) => {
        try {
          throw new Error('Redis down');
        } catch {
          return factory();
        }
      },
    });

    await expect(useCase.execute({ page: 1, limit: 6 })).resolves.toEqual(
      dummyResult,
    );
    expect(repo.list).toHaveBeenCalledTimes(1);
  });
});

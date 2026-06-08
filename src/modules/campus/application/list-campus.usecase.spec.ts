// Esta suite documenta el comportamiento de ListCampusUseCase y explica cada validaciÃ³n.
// Cada prueba estÃ¡ comentada para que alguien sin experiencia entienda quÃ© se espera.

import { ConfigService } from '@nestjs/config';
import { ListCampusUseCase } from './list-campus.usecase';
import {
  CampusRepositoryPort,
  ListOptions,
} from '../domain/campus.repository.port';
import { CacheService } from '../../_shared/infrastructure/cache/cache.service';

// Creamos un tipo de repositorio falso para espiar las llamadas.
type FakeCampusRepo = {
  list: jest.Mock<Promise<{ items: any[]; total: number }>, [ListOptions]>;
};

type ListCampusResult = {
  items: any[];
  meta: {
    total: number;
    page: number;
    take: number;
    pages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
};

const dummyResult: ListCampusResult = {
  items: [],
  meta: {
    total: 0,
    page: 1,
    take: 10,
    pages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  },
};

const mockConfigService = {
  get: jest.fn().mockReturnValue(300),
};

describe('ListCampusUseCase', () => {
  // Helper para armar el sistema bajo prueba.
  const buildSystem = (overrides?: {
    cacheGetOrSetImpl?: (
      _key: string,
      _ttl: number,
      factory: () => Promise<ListCampusResult>,
    ) => Promise<ListCampusResult>;
  }) => {
    const repo: FakeCampusRepo = {
      list: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    };

    const getOrSet = overrides?.cacheGetOrSetImpl
      ? jest.fn().mockImplementation(overrides.cacheGetOrSetImpl)
      : jest
          .fn()
          .mockImplementation(
            (
              _key: string,
              _ttl: number,
              factory: () => Promise<ListCampusResult>,
            ) => factory(),
          );

    const cache = {
      getOrSet,
      invalidate: jest.fn().mockResolvedValue(undefined),
      invalidateNamespace: jest.fn().mockResolvedValue(undefined),
    } as unknown as CacheService;

    const useCase = new ListCampusUseCase(
      repo as unknown as CampusRepositoryPort,
      cache,
      mockConfigService as unknown as ConfigService,
    );
    return { useCase, repo, cache };
  };

  it('pasa el filtro activo cuando se envia y calcula meta', async () => {
    // Arrange: repositorio devolviendo un total de 2 elementos activos.
    const { useCase, repo } = buildSystem();
    repo.list.mockResolvedValue({
      items: [{ id: 1, activo: true }],
      total: 2,
    });

    // Act: ejecutamos con skip/take y activo=true.
    const result = await useCase.execute({
      skip: 0,
      take: 5,
      search: undefined,
      orderBy: 'creado_en',
      direction: 'asc',
      activo: true,
    });

    // Assert: se pasa activo al repo y meta refleja total/paginaciÃ³n.
    expect(repo.list).toHaveBeenCalledWith({
      skip: 0,
      take: 5,
      search: undefined,
      orderBy: 'creado_en',
      direction: 'asc',
      activo: true,
    });
    expect(result.meta.total).toBe(2);
    expect(result.meta.hasNextPage).toBe(false);
  });

  it('omite el filtro activo cuando no se envia', async () => {
    const { useCase, repo } = buildSystem();

    await useCase.execute({ skip: 0, take: 10 });

    expect(repo.list).toHaveBeenCalledWith({
      skip: 0,
      take: 10,
      search: undefined,
      orderBy: 'creado_en',
      direction: 'asc',
      activo: undefined,
    });
  });

  // ── Cache behavior tests ───────────────────────────────────────

  it('llama getOrSet con key correcta que empieza por campus:list:', async () => {
    const { useCase, cache } = buildSystem();

    await useCase.execute({ skip: 0, take: 10 });

    expect(cache.getOrSet).toHaveBeenCalledWith(
      expect.stringMatching(/^campus:list:/),
      expect.any(Number),
      expect.any(Function),
    );
  });

  it('NO llama repo.list cuando cache entrega valor (cache hit)', async () => {
    const { useCase, repo } = buildSystem({
      cacheGetOrSetImpl: async () => ({ ...dummyResult }),
    });

    await useCase.execute({ skip: 0, take: 10 });

    expect(repo.list).not.toHaveBeenCalled();
  });

  it('llama repo.list cuando cache ejecuta factory (cache miss)', async () => {
    const { useCase, repo } = buildSystem();

    await useCase.execute({ skip: 0, take: 10 });

    expect(repo.list).toHaveBeenCalledTimes(1);
  });
});

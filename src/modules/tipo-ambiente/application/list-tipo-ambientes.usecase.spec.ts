// Esta suite explica cómo debe comportarse ListTipoAmbientesUseCase con ejemplos comentados.
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ListTipoAmbientesUseCase } from './list-tipo-ambientes.usecase';
import {
  ListTipoAmbientesOptions,
  ListTipoAmbientesResult,
} from '../domain/tipo-ambiente.list.types';
import { TipoAmbienteRepositoryPort } from '../domain/tipo-ambiente.repository.port';
import { CacheService } from '../../_shared/infrastructure/cache/cache.service';

type FakeTipoAmbienteRepository = {
  list: jest.Mock<Promise<ListTipoAmbientesResult>, [ListTipoAmbientesOptions]>;
};

const dummyResult: ListTipoAmbientesResult = {
  items: [],
  meta: {
    total: 0,
    page: 1,
    take: 8,
    pages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  },
};

const mockConfigService = {
  get: jest.fn().mockReturnValue(300),
};

describe('ListTipoAmbientesUseCase', () => {
  const buildSystem = (overrides?: {
    cacheGetOrSetImpl?: (
      _key: string,
      _ttl: number,
      factory: () => Promise<ListTipoAmbientesResult>,
    ) => Promise<ListTipoAmbientesResult>;
  }) => {
    const repo: FakeTipoAmbienteRepository = {
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
              factory: () => Promise<ListTipoAmbientesResult>,
            ) => factory(),
          );

    const cache = {
      getOrSet,
      invalidate: jest.fn().mockResolvedValue(undefined),
      invalidateNamespace: jest.fn().mockResolvedValue(undefined),
    } as unknown as CacheService;

    const useCase = new ListTipoAmbientesUseCase(
      repo as unknown as TipoAmbienteRepositoryPort,
      cache,
      mockConfigService as unknown as ConfigService,
    );

    return { useCase, repo, cache };
  };

  it('usa valores por defecto cuando no se envían filtros', async () => {
    const { useCase, repo } = buildSystem();

    const result = await useCase.execute({});

    expect(repo.list).toHaveBeenCalledWith({
      page: 1,
      take: 8,
      search: null,
      orderBy: 'nombre',
      orderDir: 'asc',
      activo: undefined,
    });
    expect(result.meta.total).toBe(0);
  });

  it('respalda los filtros enviados por el cliente', async () => {
    const { useCase, repo } = buildSystem();

    await useCase.execute({
      page: 2,
      limit: 5,
      search: 'lab',
      orderBy: 'creado_en',
      orderDir: 'desc',
    });

    expect(repo.list).toHaveBeenCalledWith({
      page: 2,
      take: 5,
      search: 'lab',
      orderBy: 'creado_en',
      orderDir: 'desc',
      activo: undefined,
    });
  });

  it('envヴa el filtro activo al repositorio cuando se proporciona', async () => {
    // Creamos el sistema de pruebas con mocks listos para inspeccionar las llamadas.
    const { useCase, repo } = buildSystem();
    // Ejecutamos el caso de uso indicando que queremos solo los inactivos.
    await useCase.execute({ activo: false });
    // Verificamos que el repositorio recibiИ el flag activo junto con los defaults.
    expect(repo.list).toHaveBeenCalledWith({
      page: 1,
      take: 8,
      search: null,
      orderBy: 'nombre',
      orderDir: 'asc',
      activo: false,
    });
  });

  it('lanza BadRequestException cuando activo no es booleano', async () => {
    // Preparamos el caso de uso.
    const { useCase } = buildSystem();
    // Intentamos listar con un valor invケlido para activo.
    await expect(
      useCase.execute({ activo: 'si' as unknown as boolean }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lanza BadRequestException cuando page es menor a 1', async () => {
    const { useCase } = buildSystem();

    await expect(useCase.execute({ page: 0 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('lanza BadRequestException cuando limit supera 1000', async () => {
    const { useCase } = buildSystem();

    await expect(useCase.execute({ limit: 1001 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('lanza BadRequestException cuando orderBy no está permitido', async () => {
    const { useCase } = buildSystem();

    await expect(
      useCase.execute({ orderBy: 'descripcion' as any }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lanza BadRequestException cuando orderDir es inválido', async () => {
    const { useCase } = buildSystem();

    await expect(
      useCase.execute({ orderDir: 'sideways' as any }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  // ── Cache behavior tests ───────────────────────────────────────

  it('llama getOrSet con key correcta que empieza por tipo_ambiente:list:', async () => {
    const { useCase, cache } = buildSystem();

    await useCase.execute({ page: 1, limit: 8 });

    expect(cache.getOrSet).toHaveBeenCalledWith(
      expect.stringMatching(/^tipo_ambiente:list:/),
      expect.any(Number),
      expect.any(Function),
    );
  });

  it('NO llama repo.list cuando cache entrega valor (cache hit)', async () => {
    const { repo, useCase } = buildSystem({
      cacheGetOrSetImpl: async () => ({ ...dummyResult }),
    });

    await useCase.execute({ page: 1, limit: 8 });

    expect(repo.list).not.toHaveBeenCalled();
  });

  it('llama repo.list cuando cache ejecuta factory (cache miss)', async () => {
    const { repo, useCase } = buildSystem();

    await useCase.execute({ page: 1, limit: 8 });

    expect(repo.list).toHaveBeenCalledTimes(1);
  });
});

import { BadRequestException } from '@nestjs/common';
import { ListAmbientesDisponiblesUseCase } from './list-ambientes-disponibles.usecase';
import { CacheKeyBuilder } from '../../_shared/infrastructure/cache/cache-key-builder';
import { AmbientesDisponiblesRepositoryPort } from '../domain/ambiente.disponibles.port';
import { ListAmbientesDisponiblesResult } from '../domain/ambiente.disponibles.types';

class DisponiblesRepoStub implements AmbientesDisponiblesRepositoryPort {
  public lastQuery: any;
  constructor(private readonly fixture: ListAmbientesDisponiblesResult) {}

  listDisponibles(query: any): Promise<ListAmbientesDisponiblesResult> {
    this.lastQuery = query;
    return Promise.resolve(this.fixture);
  }
}

class CacheServiceStub {
  public getOrSet = jest.fn(
    async (
      _key: string,
      _ttl: number,
      factory: () => Promise<ListAmbientesDisponiblesResult>,
    ) => factory(),
  );
}

class ConfigServiceStub {
  public get = jest.fn((key: string, defaultValue?: number) => {
    if (key === 'CACHE_TTL') {
      return defaultValue ?? 300;
    }

    return defaultValue ?? 300;
  });
}

describe('ListAmbientesDisponiblesUseCase', () => {
  const emptyResult: ListAmbientesDisponiblesResult = {
    items: [],
    meta: {
      total: 0,
      page: 1,
      take: 10,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  };

  it('cachea disponibles con la key ambiente:disponibles y delega al repositorio', async () => {
    const repo = new DisponiblesRepoStub(emptyResult);
    const cacheService = new CacheServiceStub();
    const config = new ConfigServiceStub();
    const useCase = new ListAmbientesDisponiblesUseCase(
      repo as any,
      cacheService as any,
      config as any,
    );

    const result = await useCase.execute({
      dia: 1,
      hora_inicio: '08:00',
      hora_fin: '10:00',
      capacidad_min: 10,
      tipo_ambiente_ids: [1, 2],
    });

    expect(config.get).toHaveBeenCalledWith('CACHE_TTL', 300);
    expect(cacheService.getOrSet).toHaveBeenCalledWith(
      CacheKeyBuilder.list('ambiente:disponibles', {
        capacidad_min: 10,
        capacidad_examen_min: undefined,
        mismo_piso: undefined,
        tipo_ambiente_ids: [1, 2],
        campus_ids: undefined,
        facultad_ids: undefined,
        bloque_ids: undefined,
        tipo_bloque_ids: undefined,
        horario: '1|08:00|10:00',
        page: 1,
        take: 10,
        orderBy: 'nombre',
        orderDir: 'asc',
      }),
      300,
      expect.any(Function),
    );
    expect(repo.lastQuery).toEqual({
      capacidad_min: 10,
      capacidad_examen_min: undefined,
      mismo_piso: undefined,
      tipo_ambiente_ids: [1, 2],
      campus_ids: undefined,
      facultad_ids: undefined,
      bloque_ids: undefined,
      tipo_bloque_ids: undefined,
      horario: { dia: 1, hora_inicio: '08:00', hora_fin: '10:00' },
      page: 1,
      take: 10,
      orderBy: 'nombre',
      orderDir: 'asc',
    });
    expect(result).toEqual(emptyResult);
  });

  it('devuelve el valor cacheado sin consultar el repositorio otra vez', async () => {
    const repo = new DisponiblesRepoStub(emptyResult);
    const cacheService = new CacheServiceStub();
    cacheService.getOrSet.mockResolvedValueOnce(emptyResult);
    const useCase = new ListAmbientesDisponiblesUseCase(
      repo as any,
      cacheService as any,
      new ConfigServiceStub() as any,
    );

    const result = await useCase.execute({
      dia: 1,
      hora_inicio: '08:00',
      hora_fin: '10:00',
    });

    expect(repo.lastQuery).toBeUndefined();
    expect(result).toEqual(emptyResult);
  });

  it('usa una key distinta cuando cambian los filtros de disponibles', async () => {
    const repo = new DisponiblesRepoStub(emptyResult);
    const cacheService = new CacheServiceStub();
    const seenKeys: string[] = [];
    cacheService.getOrSet.mockImplementation(async (key, _ttl, factory) => {
      seenKeys.push(key);
      return factory();
    });

    const useCase = new ListAmbientesDisponiblesUseCase(
      repo as any,
      cacheService as any,
      new ConfigServiceStub() as any,
    );

    await useCase.execute({
      dia: 1,
      hora_inicio: '08:00',
      hora_fin: '10:00',
      tipo_ambiente_ids: [1],
    });
    await useCase.execute({
      dia: 2,
      hora_inicio: '09:00',
      hora_fin: '11:00',
      tipo_ambiente_ids: [1],
    });

    expect(seenKeys[0]).toBe(
      CacheKeyBuilder.list('ambiente:disponibles', {
        capacidad_min: undefined,
        capacidad_examen_min: undefined,
        mismo_piso: undefined,
        tipo_ambiente_ids: [1],
        campus_ids: undefined,
        facultad_ids: undefined,
        bloque_ids: undefined,
        tipo_bloque_ids: undefined,
        horario: '1|08:00|10:00',
        page: 1,
        take: 10,
        orderBy: 'nombre',
        orderDir: 'asc',
      }),
    );
    expect(seenKeys[1]).toBe(
      CacheKeyBuilder.list('ambiente:disponibles', {
        capacidad_min: undefined,
        capacidad_examen_min: undefined,
        mismo_piso: undefined,
        tipo_ambiente_ids: [1],
        campus_ids: undefined,
        facultad_ids: undefined,
        bloque_ids: undefined,
        tipo_bloque_ids: undefined,
        horario: '2|09:00|11:00',
        page: 1,
        take: 10,
        orderBy: 'nombre',
        orderDir: 'asc',
      }),
    );
    expect(new Set(seenKeys).size).toBe(2);
  });

  it('rechaza hora sin dia', async () => {
    const repo = new DisponiblesRepoStub(emptyResult);
    const useCase = new ListAmbientesDisponiblesUseCase(
      repo as any,
      new CacheServiceStub() as any,
      new ConfigServiceStub() as any,
    );

    await expect(
      useCase.execute({ hora_inicio: '08:00', hora_fin: '10:00' } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza hora_inicio >= hora_fin', async () => {
    const repo = new DisponiblesRepoStub(emptyResult);
    const useCase = new ListAmbientesDisponiblesUseCase(
      repo as any,
      new CacheServiceStub() as any,
      new ConfigServiceStub() as any,
    );

    await expect(
      useCase.execute({ dia: 1, hora_inicio: '10:00', hora_fin: '08:00' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('valida arrays no vacios y enteros positivos', async () => {
    const repo = new DisponiblesRepoStub(emptyResult);
    const useCase = new ListAmbientesDisponiblesUseCase(
      repo as any,
      new CacheServiceStub() as any,
      new ConfigServiceStub() as any,
    );

    await expect(
      useCase.execute({ tipo_ambiente_ids: [] }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      useCase.execute({ tipo_ambiente_ids: [0] }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

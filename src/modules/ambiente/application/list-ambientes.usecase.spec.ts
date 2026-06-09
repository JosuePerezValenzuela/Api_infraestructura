import { BadRequestException, Injectable } from '@nestjs/common';
import { ListAmbientesUseCase } from './list-ambientes.usecase';
import { CacheKeyBuilder } from '../../_shared/infrastructure/cache/cache-key-builder';
import {
  AmbienteListItem,
  ListAmbientesOptions,
  ListAmbientesResult,
} from '../domain/ambiente.list.types';

// Definimos la forma del repositorio simulado que recibe las opciones de búsqueda y devuelve resultados paginados.
interface AmbienteRepositoryPort {
  list: jest.Mock<Promise<ListAmbientesResult>, [ListAmbientesOptions]>;
}

interface CacheServiceMock {
  getOrSet: jest.Mock<
    Promise<ListAmbientesResult>,
    [string, number, () => Promise<ListAmbientesResult>]
  >;
}

interface ConfigServiceMock {
  get: jest.Mock<number, [string, number?]>;
}

// Marcamos con Injectable una versión falsa del caso de uso para poder instanciarlo en las pruebas.
@Injectable()
class FakeListAmbientesUseCase extends ListAmbientesUseCase {}

// Creamos algunos datos de ejemplo que el repositorio devolverá cuando todo sea válido.
const sampleItems: AmbienteListItem[] = [
  {
    id: 1,
    codigo: 'AULA-101',
    nombre: 'Aula 101',
    nombre_corto: '101',
    piso: 1,
    capacidad: { total: 40, examen: 30 },
    dimension: { largo: 8, ancho: 5, alto: 3, unid_med: 'metros' },
    clases: true,
    activo: true,
    creado_en: '2025-11-10T12:00:00.000Z',
    bloque_nombre: 'Bloque Central',
    facultad_nombre: 'Facultad de Ingeniería',
    tipo_ambiente_nombre: 'Aula',
  },
];

const sampleResult: ListAmbientesResult = {
  items: sampleItems,
  meta: {
    total: 1,
    page: 1,
    take: 8,
    hasNextPage: false,
    hasPreviousPage: false,
  },
};

describe('ListAmbientesUseCase', () => {
  const buildSystem = () => {
    const repo: AmbienteRepositoryPort = {
      list: jest.fn().mockResolvedValue(sampleResult),
    };

    const cacheService: CacheServiceMock = {
      getOrSet: jest
        .fn()
        .mockImplementation(async (_key, _ttl, factory) => factory()),
    };

    const config: ConfigServiceMock = {
      get: jest
        .fn()
        .mockImplementation((key: string, defaultValue?: number) => {
          if (key === 'CACHE_TTL') {
            return defaultValue ?? 300;
          }

          return defaultValue ?? 300;
        }),
    };

    const useCase = new FakeListAmbientesUseCase(
      repo as unknown as AmbienteRepositoryPort,
      cacheService as any,
      config as any,
    );
    return { useCase, repo, cacheService, config };
  };

  it('cachea el listado usando la key ambiente:list y el ttl compartido', async () => {
    const { useCase, repo, cacheService, config } = buildSystem();
    const result = await useCase.execute({
      page: 2,
      limit: 10,
      search: 'Lab',
      orderBy: 'codigo',
      orderDir: 'desc',
      bloqueId: 5,
      campusId: null,
      facultadId: null,
      tipoAmbienteId: 2,
      activo: true,
      clases: true,
      pisoMin: 1,
      pisoMax: 3,
    });

    expect(config.get).toHaveBeenCalledWith('CACHE_TTL', 300);
    expect(cacheService.getOrSet).toHaveBeenCalledWith(
      CacheKeyBuilder.list('ambiente', {
        page: 2,
        limit: 10,
        search: 'Lab',
        orderBy: 'codigo',
        orderDir: 'desc',
        bloqueId: 5,
        campusId: null,
        facultadId: null,
        tipoAmbienteId: 2,
        activo: true,
        clases: true,
        pisoMin: 1,
        pisoMax: 3,
      }),
      300,
      expect.any(Function),
    );
    expect(repo.list).toHaveBeenCalledWith({
      page: 2,
      take: 10,
      search: 'Lab',
      orderBy: 'codigo',
      orderDir: 'desc',
      bloqueId: 5,
      campusId: null,
      facultadId: null,
      tipoAmbienteId: 2,
      activo: true,
      clases: true,
      pisoMin: 1,
      pisoMax: 3,
    });
    expect(result).toEqual(sampleResult);
  });

  it('devuelve el valor cacheado sin volver a consultar el repositorio', async () => {
    const cachedResult: ListAmbientesResult = {
      items: [],
      meta: {
        total: 0,
        page: 1,
        take: 8,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
    const { useCase, repo, cacheService } = buildSystem();
    cacheService.getOrSet.mockResolvedValueOnce(cachedResult);

    const result = await useCase.execute({ page: 1, limit: 8 });

    expect(repo.list).not.toHaveBeenCalled();
    expect(result).toEqual(cachedResult);
  });

  it('usa keys distintas para filtros distintos', async () => {
    const { useCase, cacheService } = buildSystem();
    const seenKeys: string[] = [];

    cacheService.getOrSet.mockImplementation(async (key, _ttl, factory) => {
      seenKeys.push(key);
      return factory();
    });

    await useCase.execute({ page: 1, limit: 8, search: 'uno' });
    await useCase.execute({ page: 2, limit: 8, search: 'dos' });

    expect(seenKeys[0]).toBe(
      CacheKeyBuilder.list('ambiente', {
        page: 1,
        limit: 8,
        search: 'uno',
        orderBy: 'nombre',
        orderDir: 'asc',
        bloqueId: null,
        campusId: null,
        facultadId: null,
        tipoAmbienteId: null,
        activo: null,
        clases: null,
        pisoMin: null,
        pisoMax: null,
      }),
    );
    expect(seenKeys[1]).toBe(
      CacheKeyBuilder.list('ambiente', {
        page: 2,
        limit: 8,
        search: 'dos',
        orderBy: 'nombre',
        orderDir: 'asc',
        bloqueId: null,
        campusId: null,
        facultadId: null,
        tipoAmbienteId: null,
        activo: null,
        clases: null,
        pisoMin: null,
        pisoMax: null,
      }),
    );
    expect(new Set(seenKeys).size).toBe(2);
  });

  it('normaliza filtros cuando no se envían (page=1, limit=8, etc.)', async () => {
    const { useCase, repo } = buildSystem();
    await useCase.execute({});

    expect(repo.list).toHaveBeenCalledWith({
      page: 1,
      take: 8,
      search: null,
      orderBy: 'nombre',
      orderDir: 'asc',
      bloqueId: null,
      campusId: null,
      facultadId: null,
      tipoAmbienteId: null,
      activo: null,
      clases: null,
      pisoMin: null,
      pisoMax: null,
    });
  });

  it('arroja BadRequestException cuando page es menor a 1', async () => {
    const { useCase } = buildSystem();
    await expect(useCase.execute({ page: 0 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('arroja BadRequestException cuando limit está fuera de rango', async () => {
    const { useCase } = buildSystem();
    await expect(useCase.execute({ limit: 0 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(useCase.execute({ limit: 100 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('arroja BadRequestException cuando orderBy no está permitido', async () => {
    const { useCase } = buildSystem();
    await expect(
      useCase.execute({ orderBy: 'bloque_nombre' as 'nombre' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('arroja BadRequestException cuando orderDir no es asc o desc', async () => {
    const { useCase } = buildSystem();
    await expect(
      useCase.execute({ orderDir: 'up' as 'asc' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('arroja BadRequestException cuando los ids son inválidos', async () => {
    const { useCase } = buildSystem();
    await expect(useCase.execute({ bloqueId: -1 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(useCase.execute({ facultadId: 0 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(useCase.execute({ tipoAmbienteId: 0 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('arroja BadRequestException cuando pisoMin o pisoMax no son válidos', async () => {
    const { useCase } = buildSystem();
    await expect(useCase.execute({ pisoMin: -1 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(useCase.execute({ pisoMax: 201 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('arroja BadRequestException cuando pisoMin es mayor a pisoMax', async () => {
    const { useCase } = buildSystem();
    await expect(
      useCase.execute({ pisoMin: 5, pisoMax: 2 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

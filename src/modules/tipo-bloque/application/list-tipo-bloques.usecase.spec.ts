// Estas pruebas describen el comportamiento esperado del ListTipoBloquesUseCase.
// Explican cada linea en lenguaje sencillo para que cualquier persona entienda el proceso.

import { BadRequestException } from '@nestjs/common';
import { ListTipoBloquesUseCase } from './list-tipo-bloques.usecase';
import { TipoBloqueRepositoryPort } from '../domain/tipo-bloque.repository.port';
import {
  ListTipoBloquesOptions,
  ListTipoBloquesResult,
} from '../domain/tipo-bloque.list.types';

type FakeTipoBloqueRepository = {
  list: jest.Mock<Promise<ListTipoBloquesResult>, [ListTipoBloquesOptions]>;
};

describe('ListTipoBloquesUseCase', () => {
  const buildSystem = () => {
    const repo: FakeTipoBloqueRepository = {
      list: jest.fn().mockResolvedValue({
        items: [],
        meta: {
          total: 0,
          page: 1,
          take: 8,
          pages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      }),
    };

    const useCase = new ListTipoBloquesUseCase(
      repo as TipoBloqueRepositoryPort,
    );

    return { useCase, repo };
  };

  it('devuelve la lista con los valores por defecto cuando no se envia nada', async () => {
    const { useCase, repo } = buildSystem();

    const result = await useCase.execute({});

    expect(repo.list).toHaveBeenCalledWith({
      page: 1,
      take: 8,
      search: null,
      orderBy: 'nombre',
      orderDir: 'asc',
    });
    expect(result.meta.total).toBe(0);
  });

  it('utiliza los filtros enviados por el consumidor', async () => {
    const { useCase, repo } = buildSystem();

    await useCase.execute({
      page: 3,
      limit: 5,
      search: 'laboratorio',
      orderBy: 'creado_en',
      orderDir: 'desc',
    });

    expect(repo.list).toHaveBeenCalledWith({
      page: 3,
      take: 5,
      search: 'laboratorio',
      orderBy: 'creado_en',
      orderDir: 'desc',
    });
  });

  it('lanza BadRequestException cuando page es menor a 1', async () => {
    const { useCase } = buildSystem();

    await expect(useCase.execute({ page: 0 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('lanza BadRequestException cuando limit es menor a 1', async () => {
    const { useCase } = buildSystem();

    await expect(useCase.execute({ limit: 0 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('lanza BadRequestException cuando orderBy no es permitido', async () => {
    const { useCase } = buildSystem();

    await expect(
      useCase.execute({ orderBy: 'codigo' as any }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lanza BadRequestException cuando orderDir no es permitida', async () => {
    const { useCase } = buildSystem();

    await expect(
      useCase.execute({ orderDir: 'invalid' as any }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

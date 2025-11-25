// Esta suite documenta el comportamiento de ListTipoBloquesUseCase.
// Incluye comentarios sencillos para que cualquiera entienda las validaciones.

import { BadRequestException } from '@nestjs/common';
import { ListTipoBloquesUseCase } from './list-tipo-bloques.usecase';
import {
  ListTipoBloquesOptions,
  ListTipoBloquesResult,
} from '../domain/tipo-bloque.list.types';
import { TipoBloqueRepositoryPort } from '../domain/tipo-bloque.repository.port';

// Mock del repositorio para espiar las llamadas.
type FakeRepo = {
  list: jest.Mock<Promise<ListTipoBloquesResult>, [ListTipoBloquesOptions]>;
};

describe('ListTipoBloquesUseCase', () => {
  const buildSystem = () => {
    const repo: FakeRepo = {
      list: jest.fn().mockResolvedValue({
        items: [],
        meta: {
          total: 0,
          page: 1,
          take: 6,
          pages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      }),
    };
    const useCase = new ListTipoBloquesUseCase(
      repo as unknown as TipoBloqueRepositoryPort,
    );
    return { repo, useCase };
  };

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
});

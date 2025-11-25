// Esta suite documenta el comportamiento de ListFacultadesUseCase con comentarios explicativos.
// Cada prueba muestra cÃ³mo se valida el filtro activo y cÃ³mo se propagan los argumentos.

import { BadRequestException } from '@nestjs/common';
import { ListFacultadesUseCase } from './list-facultades.usecase';
import { FacultadRepositoryPort } from '../domain/facultad.repository.port';
import { ListFacultadesQuery } from '../domain/facultad.list.types';

type FakeFacultadRepo = {
  findPaginated: jest.Mock<Promise<any>, [ListFacultadesQuery]>;
};

describe('ListFacultadesUseCase', () => {
  const buildSystem = () => {
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
    const useCase = new ListFacultadesUseCase(
      repo as unknown as FacultadRepositoryPort,
    );
    return { useCase, repo };
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
});

// Esta suite explica cómo debe comportarse ListTipoAmbientesUseCase con ejemplos comentados.
import { BadRequestException } from '@nestjs/common';
import { ListTipoAmbientesUseCase } from './list-tipo-ambientes.usecase';
import {
  ListTipoAmbientesOptions,
  ListTipoAmbientesResult,
} from '../domain/tipo-ambiente.list.types';
import { TipoAmbienteRepositoryPort } from '../domain/tipo-ambiente.repository.port';

type FakeTipoAmbienteRepository = {
  list: jest.Mock<Promise<ListTipoAmbientesResult>, [ListTipoAmbientesOptions]>;
};

describe('ListTipoAmbientesUseCase', () => {
  const buildSystem = () => {
    const repo: FakeTipoAmbienteRepository = {
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

    const useCase = new ListTipoAmbientesUseCase(
      repo as unknown as TipoAmbienteRepositoryPort,
    );

    return { useCase, repo };
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
    });
  });

  it('lanza BadRequestException cuando page es menor a 1', async () => {
    const { useCase } = buildSystem();

    await expect(useCase.execute({ page: 0 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('lanza BadRequestException cuando limit supera 50', async () => {
    const { useCase } = buildSystem();

    await expect(useCase.execute({ limit: 60 })).rejects.toBeInstanceOf(
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
});

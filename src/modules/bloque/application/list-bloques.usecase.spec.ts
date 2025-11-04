// En este archivo definimos las pruebas del caso de uso ListBloquesUseCase explicando cada paso con detalle pedagógico.
import { BadRequestException } from '@nestjs/common';
import { ListBloquesUseCase } from './list-bloques.usecase';
import {
  BloqueListOrderBy,
  BloqueListOrderDir,
} from '../domain/bloque.list.types';

// Creamos un tipo que describe el mock del repositorio, de modo que podamos espiar las llamadas fácilmente.
type BloqueRepositoryMock = {
  list: jest.Mock<
    Promise<{
      items: Array<Record<string, unknown>>;
      meta: Record<string, unknown>;
    }>,
    [
      {
        page: number;
        take: number;
        search: string | null;
        orderBy: BloqueListOrderBy;
        orderDir: BloqueListOrderDir;
        facultadId?: number | null;
        tipoBloqueId?: number | null;
        activo?: boolean | null;
        pisosMin?: number | null;
        pisosMax?: number | null;
      },
    ]
  >;
};

// Helper que construye el sistema bajo prueba con un repositorio falso configurable.
const buildSystem = () => {
  const repo: BloqueRepositoryMock = {
    list: jest.fn().mockResolvedValue({
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
  const useCase = new ListBloquesUseCase(repo as unknown as any);
  return { useCase, repo };
};

describe('ListBloquesUseCase', () => {
  it('aplica valores por defecto cuando no se envian filtros', async () => {
    const { useCase, repo } = buildSystem();
    await useCase.execute({});
    expect(repo.list).toHaveBeenCalledWith({
      page: 1,
      take: 8,
      search: null,
      orderBy: 'nombre',
      orderDir: 'asc',
      facultadId: null,
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

  it('lanza BadRequestException cuando el limite supera 50', async () => {
    const { useCase } = buildSystem();
    await expect(useCase.execute({ limit: 60 })).rejects.toBeInstanceOf(
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
});

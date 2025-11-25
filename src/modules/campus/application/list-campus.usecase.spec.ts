// Esta suite documenta el comportamiento de ListCampusUseCase y explica cada validaciÃ³n.
// Cada prueba estÃ¡ comentada para que alguien sin experiencia entienda quÃ© se espera.

import { ListCampusUseCase } from './list-campus.usecase';
import { CampusRepositoryPort, ListOptions } from '../domain/campus.repository.port';

// Creamos un tipo de repositorio falso para espiar las llamadas.
type FakeCampusRepo = {
  list: jest.Mock<Promise<{ items: any[]; total: number }>, [ListOptions]>;
};

describe('ListCampusUseCase', () => {
  // Helper para armar el sistema bajo prueba.
  const buildSystem = () => {
    const repo: FakeCampusRepo = {
      list: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    };
    const useCase = new ListCampusUseCase(repo as unknown as CampusRepositoryPort);
    return { useCase, repo };
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
});

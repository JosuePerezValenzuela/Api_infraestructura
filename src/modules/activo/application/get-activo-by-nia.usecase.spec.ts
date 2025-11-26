// Esta suite explica cómo debe comportarse GetActivoByNiaUseCase paso a paso.
// Cada caso ilustra qué se espera al buscar por NIA y cómo se manejan los errores.
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { GetActivoByNiaUseCase } from './get-activo-by-nia.usecase';
import { ActivoRepositoryPort } from '../domain/activo.repository.port';

type FakeRepo = {
  findDetailsByNia: jest.Mock<
    Promise<{
      id: number;
      nia: string;
      nombre: string;
      descripcion: string | null;
      ambiente_id: number | null;
      ambiente_nombre: string | null;
    } | null>,
    [string]
  >;
};

describe('GetActivoByNiaUseCase', () => {
  const build = () => {
    // Preparamos un repositorio falso para controlar las respuestas en cada prueba.
    const repo: FakeRepo = {
      findDetailsByNia: jest.fn(),
    };
    // Inyectamos el repositorio falso en el caso de uso real.
    const useCase = new GetActivoByNiaUseCase(
      repo as unknown as ActivoRepositoryPort,
    );
    return { repo, useCase };
  };

  it('devuelve los datos del activo cuando la NIA existe', async () => {
    // Arrange: el repositorio devuelve un activo con su ambiente asociado.
    const { repo, useCase } = build();
    repo.findDetailsByNia.mockResolvedValue({
      id: 5,
      nia: 'NIA-005',
      nombre: 'Proyector',
      descripcion: 'Sala A',
      ambiente_id: 2,
      ambiente_nombre: 'Auditorio',
    });

    // Act: buscamos por la NIA con espacios alrededor.
    const result = await useCase.execute({ nia: '  NIA-005  ' });

    // Assert: el resultado debe coincidir y trimmea la NIA antes de consultar.
    expect(repo.findDetailsByNia).toHaveBeenCalledWith('NIA-005');
    expect(result).toEqual({
      id: 5,
      nia: 'NIA-005',
      nombre: 'Proyector',
      descripcion: 'Sala A',
      ambiente_id: 2,
      ambiente_nombre: 'Auditorio',
    });
  });

  it('lanza NotFoundException cuando la NIA no existe', async () => {
    // Arrange: la búsqueda no encuentra registros.
    const { repo, useCase } = build();
    repo.findDetailsByNia.mockResolvedValue(null);

    // Act & Assert: el caso de uso debe propagar un NotFound claro.
    await expect(useCase.execute({ nia: 'NIA-404' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('lanza BadRequestException cuando la NIA es vacía', async () => {
    // Arrange: no configuramos el repo porque no debería llamarse.
    const { useCase } = build();

    // Act & Assert.
    await expect(useCase.execute({ nia: '   ' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('lanza BadRequestException cuando la NIA supera 32 caracteres', async () => {
    // Arrange: generamos una cadena larga.
    const { useCase } = build();
    const longNia = 'X'.repeat(40);

    // Act & Assert.
    await expect(useCase.execute({ nia: longNia })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});

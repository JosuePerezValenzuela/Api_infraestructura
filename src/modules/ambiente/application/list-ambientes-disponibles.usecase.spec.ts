import { BadRequestException } from '@nestjs/common';
import { ListAmbientesDisponiblesUseCase } from './list-ambientes-disponibles.usecase';
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

  it('valida horario completo (dia, hora_inicio, hora_fin) y delega al repositorio', async () => {
    const repo = new DisponiblesRepoStub(emptyResult);
    const useCase = new ListAmbientesDisponiblesUseCase(repo as any);

    const result = await useCase.execute({
      dia: 1,
      hora_inicio: '08:00',
      hora_fin: '10:00',
      capacidad_min: 10,
      tipo_ambiente_ids: [1, 2],
    });

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

  it('rechaza hora sin dia', async () => {
    const repo = new DisponiblesRepoStub(emptyResult);
    const useCase = new ListAmbientesDisponiblesUseCase(repo as any);

    await expect(
      useCase.execute({ hora_inicio: '08:00', hora_fin: '10:00' } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza hora_inicio >= hora_fin', async () => {
    const repo = new DisponiblesRepoStub(emptyResult);
    const useCase = new ListAmbientesDisponiblesUseCase(repo as any);

    await expect(
      useCase.execute({ dia: 1, hora_inicio: '10:00', hora_fin: '08:00' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('valida arrays no vacios y enteros positivos', async () => {
    const repo = new DisponiblesRepoStub(emptyResult);
    const useCase = new ListAmbientesDisponiblesUseCase(repo as any);

    await expect(
      useCase.execute({ tipo_ambiente_ids: [] }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      useCase.execute({ tipo_ambiente_ids: [0] }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('valida relaciones: facultad_ids debe ser subconjunto de campus_ids cuando ambos vienen', async () => {
    const repo = new DisponiblesRepoStub(emptyResult);
    const useCase = new ListAmbientesDisponiblesUseCase(repo as any);

    await expect(
      useCase.execute({ campus_ids: [1, 2], facultad_ids: [3] } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('valida relaciones: bloque_ids debe ser subconjunto de facultad_ids cuando ambos vienen', async () => {
    const repo = new DisponiblesRepoStub(emptyResult);
    const useCase = new ListAmbientesDisponiblesUseCase(repo as any);

    await expect(
      useCase.execute({ facultad_ids: [5], bloque_ids: [7] } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

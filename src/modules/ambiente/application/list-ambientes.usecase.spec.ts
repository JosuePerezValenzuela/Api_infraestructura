// Este archivo guía paso a paso el comportamiento esperado del caso de uso ListAmbientesUseCase.
// Cada prueba describe en lenguaje sencillo qué valida y por qué, pensando en lectores sin experiencia previa.

import { BadRequestException, Injectable } from '@nestjs/common';
import { ListAmbientesUseCase } from './list-ambientes.usecase';
import {
  AmbienteListItem,
  ListAmbientesOptions,
  ListAmbientesResult,
} from '../domain/ambiente.list.types';

// Definimos la forma del repositorio simulado que recibe las opciones de búsqueda y devuelve resultados paginados.
interface AmbienteRepositoryPort {
  list: jest.Mock<Promise<ListAmbientesResult>, [ListAmbientesOptions]>;
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

    const useCase = new FakeListAmbientesUseCase(
      repo as unknown as AmbienteRepositoryPort,
    );
    return { useCase, repo };
  };

  it('devuelve el listado cuando los filtros son válidos', async () => {
    const { useCase, repo } = buildSystem();
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

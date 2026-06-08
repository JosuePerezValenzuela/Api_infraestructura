// Archivo de pruebas para UpdateFacultadUseCase.
// Sigue el patron de update-campus.usecase.spec.ts

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UpdateFacultadUseCase } from './update-facultad.usecase';
import type { facultadCompleta } from '../domain/facultad.list.types';
import type { FacultadRepositoryPort } from '../domain/facultad.repository.port';
import type { RelationshipsPort } from '../../_shared/relationships/domain/relationships.port';
import type { CampusRepositoryPort } from '../../campus/domain/campus.repository.port';
import { CacheService } from '../../_shared/infrastructure/cache/cache.service';

// Definimos una interfaz auxiliar que describe las funciones que vamos a simular del repositorio de facultades.
interface FakeFacultadRepositoryPort {
  findById: jest.Mock<Promise<facultadCompleta | null>, [number]>;
  update: jest.Mock<Promise<void>, [number, any]>;
  isCodeTaken: jest.Mock<Promise<boolean>, [string, number | undefined]>;
}

// Definimos una interfaz auxiliar que describe las funciones del puerto de relaciones.
interface FakeRelationshipsPort {
  markFacultadCascadeInactive: jest.Mock<Promise<void>, [number]>;
}

// Definimos una interfaz auxiliar para el repositorio de campus.
interface FakeCampusRepositoryPort {
  findById: jest.Mock<Promise<{ id: number } | null>, [number]>;
}

describe('UpdateFacultadUseCase', () => {
  // Funcion de ayuda que monta el sistema bajo prueba con dependencias simuladas.
  const buildSystem = () => {
    const facultadRepo: FakeFacultadRepositoryPort = {
      findById: jest.fn(),
      update: jest.fn(),
      isCodeTaken: jest.fn(),
    };

    const relationships: FakeRelationshipsPort = {
      markFacultadCascadeInactive: jest.fn(),
    };

    const campusRepo: FakeCampusRepositoryPort = {
      findById: jest.fn(),
    };

    const cache = {
      getOrSet: jest.fn().mockResolvedValue(undefined),
      invalidate: jest.fn().mockResolvedValue(undefined),
      invalidateNamespace: jest.fn().mockResolvedValue(undefined),
    } as unknown as CacheService;

    const useCase = new (UpdateFacultadUseCase as any)(
      facultadRepo as unknown as FacultadRepositoryPort,
      relationships as unknown as RelationshipsPort,
      campusRepo as unknown as CampusRepositoryPort,
      cache,
    );

    return { useCase, facultadRepo, relationships, campusRepo, cache };
  };

  // Datos base de una facultad existente para las pruebas
  const existingFacultad: facultadCompleta = {
    id: 1,
    codigo: 'FCT-001',
    nombre: 'Facultad de Ciencias',
    nombre_corto: 'FC',
    lat: -17.389,
    lng: -66.156,
    activo: true,
    campus_id: 3,
    campus_ids: [3],
  };

  // Flujo feliz: actualiza una facultad cuando los datos son válidos
  it('actualiza una facultad cuando los datos son validos', async () => {
    const { useCase, facultadRepo } = buildSystem();

    facultadRepo.findById.mockResolvedValue(existingFacultad);
    facultadRepo.isCodeTaken.mockResolvedValue(false);
    facultadRepo.update.mockResolvedValue();

    const result = await useCase.execute({
      id: 1,
      input: { nombre: 'Facultad de Ciencias Actualizada' },
    });

    expect(result).toEqual({ id: 1 });
    expect(facultadRepo.update).toHaveBeenCalledWith(1, {
      nombre: 'Facultad de Ciencias Actualizada',
    });
  });

  // Lanza NotFoundException cuando la facultad no existe
  it('lanza NotFoundException cuando la facultad no existe', async () => {
    const { useCase } = buildSystem();

    await expect(
      useCase.execute({
        id: 999,
        input: { nombre: 'Nueva Facultad' },
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  // Lanza BadRequestException cuando no hay campos para actualizar
  it('lanza BadRequestException cuando no hay campos para actualizar', async () => {
    const { useCase, facultadRepo } = buildSystem();

    facultadRepo.findById.mockResolvedValue(existingFacultad);

    await expect(
      useCase.execute({
        id: 1,
        input: {},
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  // ── Cache invalidation tests ───────────────────────────────────

  it('llama invalidateNamespace despues de actualizar exitosamente', async () => {
    const { useCase, facultadRepo, cache } = buildSystem();

    facultadRepo.findById.mockResolvedValue(existingFacultad);
    facultadRepo.isCodeTaken.mockResolvedValue(false);
    facultadRepo.update.mockResolvedValue();

    await useCase.execute({
      id: 1,
      input: { nombre: 'Facultad Renovada' },
    });

    expect(facultadRepo.update).toHaveBeenCalled();
    expect(cache.invalidateNamespace).toHaveBeenCalledWith('facultad:*');
  });

  it('NO llama invalidateNamespace cuando update falla', async () => {
    const { useCase, facultadRepo, cache } = buildSystem();

    facultadRepo.findById.mockResolvedValue(existingFacultad);
    facultadRepo.isCodeTaken.mockResolvedValue(false);

    const error = new Error('DB error');
    facultadRepo.update.mockRejectedValue(error);

    await expect(
      useCase.execute({
        id: 1,
        input: { nombre: 'Nuevo Nombre' },
      }),
    ).rejects.toThrow(error);

    expect(cache.invalidateNamespace).not.toHaveBeenCalled();
  });
});

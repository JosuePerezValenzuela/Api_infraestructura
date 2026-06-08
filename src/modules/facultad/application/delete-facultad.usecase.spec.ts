// Archivo de pruebas para DeleteFacultadUseCase.

import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { DeleteFacultadUseCase } from '../application/delete-facultad.usecase';
import type { facultadCompleta } from '../domain/facultad.list.types';
import type {
  FacultadRepositoryPort,
  RelatedBlock,
} from '../domain/facultad.repository.port';
import { CacheService } from '../../_shared/infrastructure/cache/cache.service';

// Definimos la forma del repositorio simulado.
interface FakeFacultadRepository {
  findById: jest.Mock<Promise<facultadCompleta | null>, [number]>;
  findCampusById: jest.Mock<Promise<{ id: number } | null>, [number]>;
  findCampusFacultadRelationship: jest.Mock<
    Promise<{ id: number } | null>,
    [number, number]
  >;
  findBlocksByCampusFacultadId: jest.Mock<Promise<RelatedBlock[]>, [number]>;
  deleteRelationship: jest.Mock<Promise<{ id: number }>, [number, number]>;
  hasOtherRelationships: jest.Mock<Promise<boolean>, [number, number]>;
  deleteFacultad: jest.Mock<Promise<{ id: number }>, [number]>;
}

describe('DeleteFacultadUseCase', () => {
  // Funcion auxiliar que arma el sistema de pruebas.
  const buildSystem = () => {
    const facultadRepo: FakeFacultadRepository = {
      findById: jest.fn(),
      findCampusById: jest.fn(),
      findCampusFacultadRelationship: jest.fn(),
      findBlocksByCampusFacultadId: jest.fn(),
      deleteRelationship: jest.fn(),
      hasOtherRelationships: jest.fn(),
      deleteFacultad: jest.fn(),
    };

    const cache = {
      getOrSet: jest.fn().mockResolvedValue(undefined),
      invalidate: jest.fn().mockResolvedValue(undefined),
      invalidateNamespace: jest.fn().mockResolvedValue(undefined),
    } as unknown as CacheService;

    const useCase = new (DeleteFacultadUseCase as any)(
      facultadRepo as unknown as FacultadRepositoryPort,
      cache,
    );

    return { facultadRepo, useCase, cache };
  };

  // Flujo feliz: la relación existe, no tiene bloques dependientes, y la facultad se elimina porque era su única relación
  it('elimina la relacion y la facultad cuando era su unica relacion', async () => {
    const { facultadRepo, useCase } = buildSystem();

    // La facultad existe
    facultadRepo.findById.mockResolvedValue({
      id: 1,
      codigo: 'FCT-001',
      nombre: 'Facultad de Ciencias',
      nombre_corto: 'FC',
      lat: -17.389,
      lng: -66.156,
      activo: true,
      campus_id: 3,
      campus_ids: [3],
    });

    // El campus existe
    facultadRepo.findCampusById.mockResolvedValue({ id: 3 });

    // La relación existe
    facultadRepo.findCampusFacultadRelationship.mockResolvedValue({ id: 10 });

    // No hay bloques dependientes
    facultadRepo.findBlocksByCampusFacultadId.mockResolvedValue([]);

    // No tiene otras relaciones (era la única)
    facultadRepo.hasOtherRelationships.mockResolvedValue(false);

    // Ejecutamos
    const result = await useCase.execute({ id: 1, campusId: 3 });

    // Verificamos
    expect(result.id).toBe(1);
    expect(result.deletedFacultad).toBe(true);
    expect(facultadRepo.deleteRelationship).toHaveBeenCalledWith(1, 3);
    expect(facultadRepo.deleteFacultad).toHaveBeenCalledWith(1);
  });

  // Flujo: la relación existe, no tiene bloques dependientes, pero la facultad tiene otras relaciones
  it('elimina solo la relacion cuando la facultad tiene otras relaciones', async () => {
    const { facultadRepo, useCase } = buildSystem();

    // La facultad existe
    facultadRepo.findById.mockResolvedValue({
      id: 1,
      codigo: 'FCT-001',
      nombre: 'Facultad de Ciencias',
      nombre_corto: 'FC',
      lat: -17.389,
      lng: -66.156,
      activo: true,
      campus_id: 3,
      campus_ids: [3, 5], // Tiene más de una relación
    });

    // El campus existe
    facultadRepo.findCampusById.mockResolvedValue({ id: 3 });

    // La relación existe
    facultadRepo.findCampusFacultadRelationship.mockResolvedValue({ id: 10 });

    // No hay bloques dependientes
    facultadRepo.findBlocksByCampusFacultadId.mockResolvedValue([]);

    // Tiene otras relaciones
    facultadRepo.hasOtherRelationships.mockResolvedValue(true);

    // Ejecutamos
    const result = await useCase.execute({ id: 1, campusId: 3 });

    // Verificamos
    expect(result.id).toBe(1);
    expect(result.deletedFacultad).toBe(false);
    expect(facultadRepo.deleteRelationship).toHaveBeenCalledWith(1, 3);
    expect(facultadRepo.deleteFacultad).not.toHaveBeenCalled();
  });

  // NotFoundException cuando la facultad no existe
  it('lanza NotFoundException cuando la facultad no existe', async () => {
    const { facultadRepo, useCase } = buildSystem();

    facultadRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ id: 999, campusId: 3 }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(facultadRepo.findCampusById).not.toHaveBeenCalled();
    expect(facultadRepo.deleteRelationship).not.toHaveBeenCalled();
  });

  // NotFoundException cuando el campus no existe
  it('lanza NotFoundException cuando el campus no existe', async () => {
    const { facultadRepo, useCase } = buildSystem();

    // La facultad existe
    facultadRepo.findById.mockResolvedValue({
      id: 1,
      codigo: 'FCT-001',
      nombre: 'Facultad de Ciencias',
      nombre_corto: 'FC',
      lat: -17.389,
      lng: -66.156,
      activo: true,
      campus_id: 3,
      campus_ids: [3],
    });

    // El campus NO existe
    facultadRepo.findCampusById.mockResolvedValue(null);

    await expect(
      useCase.execute({ id: 1, campusId: 999 }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(facultadRepo.findCampusFacultadRelationship).not.toHaveBeenCalled();
    expect(facultadRepo.deleteRelationship).not.toHaveBeenCalled();
  });

  // BadRequestException cuando la relación NO existe (ni activa ni inactiva)
  it('lanza BadRequestException cuando la relacion no existe', async () => {
    const { facultadRepo, useCase } = buildSystem();

    // La facultad existe
    facultadRepo.findById.mockResolvedValue({
      id: 1,
      codigo: 'FCT-001',
      nombre: 'Facultad de Ciencias',
      nombre_corto: 'FC',
      lat: -17.389,
      lng: -66.156,
      activo: true,
      campus_id: 3,
      campus_ids: [3],
    });

    // El campus existe
    facultadRepo.findCampusById.mockResolvedValue({ id: 3 });

    // La relación NO existe (ni activa ni inactiva)
    facultadRepo.findCampusFacultadRelationship.mockResolvedValue(null);

    await expect(
      useCase.execute({ id: 1, campusId: 3 }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(facultadRepo.findBlocksByCampusFacultadId).not.toHaveBeenCalled();
    expect(facultadRepo.deleteRelationship).not.toHaveBeenCalled();
  });

  // Permite eliminar relaciones inactivas si no tienen bloques dependientes
  it('permite eliminar una relacion inactiva si no tiene bloques dependientes', async () => {
    const { facultadRepo, useCase } = buildSystem();

    // La facultad existe
    facultadRepo.findById.mockResolvedValue({
      id: 1,
      codigo: 'FCT-001',
      nombre: 'Facultad de Ciencias',
      nombre_corto: 'FC',
      lat: -17.389,
      lng: -66.156,
      activo: true,
      campus_id: 3,
      campus_ids: [3],
    });

    // El campus existe
    facultadRepo.findCampusById.mockResolvedValue({ id: 3 });

    // La relación existe (aunque esté inactiva)
    facultadRepo.findCampusFacultadRelationship.mockResolvedValue({ id: 10 });

    // No hay bloques dependientes
    facultadRepo.findBlocksByCampusFacultadId.mockResolvedValue([]);

    // No tiene otras relaciones
    facultadRepo.hasOtherRelationships.mockResolvedValue(false);

    // Ejecutamos
    const result = await useCase.execute({ id: 1, campusId: 3 });

    // Verificamos que se eliminó
    expect(result.id).toBe(1);
    expect(result.deletedFacultad).toBe(true);
    expect(facultadRepo.deleteRelationship).toHaveBeenCalledWith(1, 3);
    expect(facultadRepo.deleteFacultad).toHaveBeenCalledWith(1);
  });

  // ConflictException cuando hay bloques dependientes
  it('lanza ConflictException cuando hay bloques dependientes', async () => {
    const { facultadRepo, useCase } = buildSystem();

    // La facultad existe
    facultadRepo.findById.mockResolvedValue({
      id: 1,
      codigo: 'FCT-001',
      nombre: 'Facultad de Ciencias',
      nombre_corto: 'FC',
      lat: -17.389,
      lng: -66.156,
      activo: true,
      campus_id: 3,
      campus_ids: [3],
    });

    // El campus existe
    facultadRepo.findCampusById.mockResolvedValue({ id: 3 });

    // La relación existe
    facultadRepo.findCampusFacultadRelationship.mockResolvedValue({ id: 10 });

    // Hay bloques dependientes
    const relatedBlocks: RelatedBlock[] = [
      {
        id: 1,
        codigo: 'EDIF-A',
        nombre: 'Edificio A',
        nombre_corto: 'EA',
        activo: true,
        campus_nombre: 'Campus Central',
      },
    ];
    facultadRepo.findBlocksByCampusFacultadId.mockResolvedValue(relatedBlocks);

    await expect(
      useCase.execute({ id: 1, campusId: 3 }),
    ).rejects.toBeInstanceOf(ConflictException);

    // Verificamos el formato del error
    const error = await useCase.execute({ id: 1, campusId: 3 }).catch((e) => e);
    const response = error.getResponse() as any;
    expect(response.error).toBe('CONFLICT_ERROR');
    expect(response.message).toBe(
      'No se puede eliminar la relacion porque hay bloques dependientes',
    );
    expect(response.details[0].block.id).toBe(1);

    expect(facultadRepo.deleteRelationship).not.toHaveBeenCalled();
    expect(facultadRepo.deleteFacultad).not.toHaveBeenCalled();
  });

  // Propaga error cuando deleteRelationship falla
  it('propaga el error cuando deleteRelationship falla', async () => {
    const { facultadRepo, useCase } = buildSystem();

    // La facultad existe
    facultadRepo.findById.mockResolvedValue({
      id: 1,
      codigo: 'FCT-001',
      nombre: 'Facultad de Ciencias',
      nombre_corto: 'FC',
      lat: -17.389,
      lng: -66.156,
      activo: true,
      campus_id: 3,
      campus_ids: [3],
    });

    // El campus existe
    facultadRepo.findCampusById.mockResolvedValue({ id: 3 });

    // La relación existe
    facultadRepo.findCampusFacultadRelationship.mockResolvedValue({ id: 10 });

    // No hay bloques dependientes
    facultadRepo.findBlocksByCampusFacultadId.mockResolvedValue([]);

    // DeleteRelationship falla
    const failure = new Error('Fallo en la base de datos');
    facultadRepo.deleteRelationship.mockRejectedValue(failure);

    await expect(useCase.execute({ id: 1, campusId: 3 })).rejects.toThrow(
      failure,
    );
  });

  // ── Cache invalidation tests ───────────────────────────────────

  it('llama invalidateNamespace despues de eliminar (sin otras relaciones)', async () => {
    const { facultadRepo, useCase, cache } = buildSystem();

    facultadRepo.findById.mockResolvedValue({
      id: 1,
      codigo: 'FCT-001',
      nombre: 'Facultad de Ciencias',
      nombre_corto: 'FC',
      lat: -17.389,
      lng: -66.156,
      activo: true,
      campus_id: 3,
      campus_ids: [3],
    });
    facultadRepo.findCampusById.mockResolvedValue({ id: 3 });
    facultadRepo.findCampusFacultadRelationship.mockResolvedValue({ id: 10 });
    facultadRepo.findBlocksByCampusFacultadId.mockResolvedValue([]);
    facultadRepo.deleteRelationship.mockResolvedValue({ id: 1 });
    facultadRepo.hasOtherRelationships.mockResolvedValue(false);
    facultadRepo.deleteFacultad.mockResolvedValue({ id: 1 });

    await useCase.execute({ id: 1, campusId: 3 });

    expect(cache.invalidateNamespace).toHaveBeenCalledWith('facultad:*');
  });

  it('llama invalidateNamespace despues de eliminar (con otras relaciones)', async () => {
    const { facultadRepo, useCase, cache } = buildSystem();

    facultadRepo.findById.mockResolvedValue({
      id: 1,
      codigo: 'FCT-001',
      nombre: 'Facultad de Ciencias',
      nombre_corto: 'FC',
      lat: -17.389,
      lng: -66.156,
      activo: true,
      campus_id: 3,
      campus_ids: [3, 5],
    });
    facultadRepo.findCampusById.mockResolvedValue({ id: 3 });
    facultadRepo.findCampusFacultadRelationship.mockResolvedValue({ id: 10 });
    facultadRepo.findBlocksByCampusFacultadId.mockResolvedValue([]);
    facultadRepo.deleteRelationship.mockResolvedValue({ id: 1 });
    facultadRepo.hasOtherRelationships.mockResolvedValue(true);

    await useCase.execute({ id: 1, campusId: 3 });

    expect(cache.invalidateNamespace).toHaveBeenCalledWith('facultad:*');
  });

  it('NO llama invalidateNamespace cuando la facultad no existe', async () => {
    const { facultadRepo, useCase, cache } = buildSystem();

    facultadRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ id: 999, campusId: 3 }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(cache.invalidateNamespace).not.toHaveBeenCalled();
  });

  it('NO llama invalidateNamespace cuando delete lanza error', async () => {
    const { facultadRepo, useCase, cache } = buildSystem();

    facultadRepo.findById.mockResolvedValue({
      id: 1,
      codigo: 'FCT-001',
      nombre: 'Facultad de Ciencias',
      nombre_corto: 'FC',
      lat: -17.389,
      lng: -66.156,
      activo: true,
      campus_id: 3,
      campus_ids: [3],
    });
    facultadRepo.findCampusById.mockResolvedValue({ id: 3 });
    facultadRepo.findCampusFacultadRelationship.mockResolvedValue({ id: 10 });
    facultadRepo.findBlocksByCampusFacultadId.mockResolvedValue([]);

    const error = new Error('DB error');
    facultadRepo.deleteRelationship.mockRejectedValue(error);

    await expect(useCase.execute({ id: 1, campusId: 3 })).rejects.toThrow(
      error,
    );

    expect(cache.invalidateNamespace).not.toHaveBeenCalled();
  });
});

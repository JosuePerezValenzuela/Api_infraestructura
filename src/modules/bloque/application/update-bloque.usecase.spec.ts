// En este archivo recopilamos las pruebas del caso de uso UpdateBloqueUseCase y documentamos cada paso
// para que cualquier persona, incluso sin experiencia previa, pueda seguir la lógica del dominio.

import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { UpdateBloqueUseCase } from './update-bloque.usecase';
import type {
  BloqueRepositoryPort,
  BloqueSnapshot,
} from '../domain/bloque.repository.port';
import type { UpdateBloqueCommand } from '../domain/commands/update-bloque.command';
import type { FacultadRepositoryPort } from '../../facultad/domain/facultad.repository.port';
import type { TipoBloqueRepositoryPort } from '../../tipo-bloque/domain/tipo-bloque.repository.port';
import type { RelationshipsPort } from '../../_shared/relationships/domain/relationships.port';
import { CacheService } from '../../_shared/infrastructure/cache/cache.service';

// Declaramos una interfaz auxiliar que describe los mocks que usaremos para el repositorio de bloques.
interface FakeBloqueRepositoryPort {
  findById: jest.Mock<Promise<BloqueSnapshot | null>, [number]>;
  isCodeTaken: jest.Mock<Promise<boolean>, [string, number?]>;
  update: jest.Mock<Promise<{ id: number }>, [UpdateBloqueCommand]>;
}

// Interfaces auxiliares para los otros puertos.
interface FakeFacultadRepositoryPort {
  findById: jest.Mock<Promise<{ id: number } | null>, [number]>;
  findCampusById: jest.Mock<Promise<{ id: number } | null>, [number]>;
  findCampusFacultadRelationship: jest.Mock<
    Promise<{ id: number } | null>,
    [number, number]
  >;
}

interface FakeTipoBloqueRepositoryPort {
  findById: jest.Mock<Promise<{ id: number } | null>, [number]>;
}

interface FakeRelationshipsPort {
  markBloquesCascadeInactive: jest.Mock<Promise<void>, [number]>;
}

interface FakeCacheService {
  getOrSet: jest.Mock<
    Promise<unknown>,
    [string, number, () => Promise<unknown>]
  >;
  invalidateNamespace: jest.Mock<Promise<void>, [string]>;
}

// Creamos un bloque de ejemplo que reutilizaremos en varios escenarios.
const existingBloque: BloqueSnapshot = {
  id: 42,
  codigo: 'BLOQUE-OLD',
  nombre: 'Bloque Antiguo',
  nombre_corto: 'Antiguo',
  pisos: 3,
  activo: true,
  campus_facultad_id: 1,
  facultad_id: 7,
  campus_id: 1,
  tipo_bloque_id: 5,
  coordenadas: { lat: -17.4, lng: -66.15 },
};

describe('UpdateBloqueUseCase', () => {
  // Esta función nos permite construir el sistema bajo prueba con mocks frescos en cada test.
  const buildSystem = () => {
    const bloqueRepo: FakeBloqueRepositoryPort = {
      findById: jest.fn(),
      isCodeTaken: jest.fn(),
      update: jest.fn(),
    };

    const facultadRepo: FakeFacultadRepositoryPort = {
      findById: jest.fn(),
      findCampusById: jest.fn(),
      findCampusFacultadRelationship: jest.fn(),
    };

    const tipoBloqueRepo: FakeTipoBloqueRepositoryPort = {
      findById: jest.fn(),
    };

    const relationships: FakeRelationshipsPort = {
      markBloquesCascadeInactive: jest.fn(),
    };

    const cache: FakeCacheService = {
      getOrSet: jest.fn(),
      invalidateNamespace: jest.fn().mockResolvedValue(undefined),
    };

    const useCase = new (UpdateBloqueUseCase as any)(
      bloqueRepo as unknown as BloqueRepositoryPort,
      facultadRepo as unknown as FacultadRepositoryPort,
      tipoBloqueRepo as unknown as TipoBloqueRepositoryPort,
      relationships as unknown as RelationshipsPort,
      cache as unknown as CacheService,
    );

    return {
      useCase,
      bloqueRepo,
      facultadRepo,
      tipoBloqueRepo,
      relationships,
      cache,
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // 1. Verificamos que cuando el bloque no existe devolvemos el mismo error que la API espera.
  it('lanza NotFoundException cuando el bloque no existe', async () => {
    const { useCase, bloqueRepo } = buildSystem();
    bloqueRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ id: 999, input: { nombre: 'Nuevo nombre' } }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(bloqueRepo.update).not.toHaveBeenCalled();
  });

  // 2. La HU señala que solo se deben aplicar cambios si de verdad llegan campos, por eso prohibimos actualizaciones vacías.
  it('rechaza un payload sin cambios', async () => {
    const { useCase, bloqueRepo } = buildSystem();
    bloqueRepo.findById.mockResolvedValue(existingBloque);

    await expect(useCase.execute({ id: 42, input: {} })).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(bloqueRepo.update).not.toHaveBeenCalled();
  });

  // 3. Si el usuario intenta reutilizar un código ya tomado por otro bloque debemos avisarle con un conflicto.
  it('lanza ConflictException cuando el nuevo codigo ya existe en otro bloque', async () => {
    const { useCase, bloqueRepo } = buildSystem();
    bloqueRepo.findById.mockResolvedValue(existingBloque);
    bloqueRepo.isCodeTaken.mockResolvedValue(true);

    await expect(
      useCase.execute({ id: 42, input: { codigo: 'BLOQUE-DUP' } }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(bloqueRepo.update).not.toHaveBeenCalled();
    expect(bloqueRepo.isCodeTaken).toHaveBeenCalledWith('BLOQUE-DUP', 42);
  });

  // 4. La facultad debe existir cuando se envía un nuevo facultad_id; si no, devolvemos un error claro.
  it('valida la existencia de la facultad cuando se envía facultad_id', async () => {
    const { useCase, bloqueRepo, facultadRepo } = buildSystem();
    bloqueRepo.findById.mockResolvedValue(existingBloque);
    bloqueRepo.isCodeTaken.mockResolvedValue(false);
    facultadRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ id: 42, input: { facultad_id: 99 } }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(facultadRepo.findById).toHaveBeenCalledWith(99);
    expect(bloqueRepo.update).not.toHaveBeenCalled();
  });

  // 5. Igual validamos que el tipo de bloque exista antes de proceder.
  it('valida la existencia del tipo de bloque cuando se envía tipo_bloque_id', async () => {
    const { useCase, bloqueRepo, tipoBloqueRepo } = buildSystem();
    bloqueRepo.findById.mockResolvedValue(existingBloque);
    bloqueRepo.isCodeTaken.mockResolvedValue(false);
    tipoBloqueRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ id: 42, input: { tipo_bloque_id: 55 } }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(tipoBloqueRepo.findById).toHaveBeenCalledWith(55);
    expect(bloqueRepo.update).not.toHaveBeenCalled();
  });

  // 6. Esta prueba cubre la regla de negocio que obliga a enviar lat y lng juntos.
  it('rechaza cuando solo se envia lat sin lng', async () => {
    const { useCase, bloqueRepo } = buildSystem();
    bloqueRepo.findById.mockResolvedValue(existingBloque);
    bloqueRepo.isCodeTaken.mockResolvedValue(false);

    await expect(
      useCase.execute({ id: 42, input: { lat: -17.39 } }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(bloqueRepo.update).not.toHaveBeenCalled();
  });

  // 7. Cuando todo es correcto transformamos las coordenadas a POINT y enviamos el comando al repositorio.
  it('normaliza datos, transforma lat/lng a point y actualiza el bloque', async () => {
    const { useCase, bloqueRepo, facultadRepo, tipoBloqueRepo } = buildSystem();
    bloqueRepo.findById.mockResolvedValue(existingBloque);
    bloqueRepo.isCodeTaken.mockResolvedValue(false);
    facultadRepo.findById.mockResolvedValue({ id: 9 });
    facultadRepo.findCampusById.mockResolvedValue({ id: 1 });
    facultadRepo.findCampusFacultadRelationship.mockResolvedValue({ id: 1 });
    tipoBloqueRepo.findById.mockResolvedValue({ id: 3 });
    bloqueRepo.update.mockResolvedValue({ id: 42 });

    await useCase.execute({
      id: 42,
      input: {
        codigo: '  BLOQUE-NEW  ',
        nombre: '  Bloque Renovado  ',
        nombre_corto: '  Renovado  ',
        pisos: 6,
        lat: -17.3937,
        lng: -66.1568,
        activo: true,
        facultad_id: 9,
        tipo_bloque_id: 3,
      },
    });

    expect(bloqueRepo.update).toHaveBeenCalledWith({
      id: 42,
      codigo: 'BLOQUE-NEW',
      nombre: 'Bloque Renovado',
      nombre_corto: 'Renovado',
      pisos: 6,
      coordinates: { pointLiteral: '-66.1568,-17.3937' },
      activo: true,
      campus_facultad_id: 1,
      tipo_bloque_id: 3,
    });
  });

  // 8. Si el bloque pasa de activo=true a activo=false debemos notificar al puerto de relaciones.
  it('marca dependencias inactivas cuando el bloque pasa a inactivo', async () => {
    const { useCase, bloqueRepo, relationships } = buildSystem();
    bloqueRepo.findById.mockResolvedValue({ ...existingBloque, activo: true });
    bloqueRepo.isCodeTaken.mockResolvedValue(false);
    bloqueRepo.update.mockResolvedValue({ id: 42 });

    await useCase.execute({ id: 42, input: { activo: false } });

    expect(relationships.markBloquesCascadeInactive).toHaveBeenCalledTimes(1);
    expect(relationships.markBloquesCascadeInactive).toHaveBeenCalledWith(42);
  });

  // 9. Si ya estaba inactivo y se mantiene así no llamamos a la cascada para ahorrar trabajo.
  it('no marca dependencias cuando el bloque ya estaba inactivo', async () => {
    const { useCase, bloqueRepo, relationships } = buildSystem();
    bloqueRepo.findById.mockResolvedValue({ ...existingBloque, activo: false });
    bloqueRepo.isCodeTaken.mockResolvedValue(false);
    bloqueRepo.update.mockResolvedValue({ id: 42 });

    await useCase.execute({ id: 42, input: { activo: false } });

    expect(relationships.markBloquesCascadeInactive).not.toHaveBeenCalled();
  });

  it('invalidates bloque namespace after a successful update', async () => {
    const { useCase, bloqueRepo, cache } = buildSystem();
    bloqueRepo.findById.mockResolvedValue(existingBloque);
    bloqueRepo.isCodeTaken.mockResolvedValue(false);
    bloqueRepo.update.mockResolvedValue({ id: 42 });

    await useCase.execute({ id: 42, input: { nombre: 'Bloque Renovado' } });

    expect(bloqueRepo.update).toHaveBeenCalled();
    expect(cache.invalidateNamespace).toHaveBeenCalledWith('bloque:*');
    expect(
      cache.invalidateNamespace.mock.invocationCallOrder[0],
    ).toBeGreaterThan(bloqueRepo.update.mock.invocationCallOrder[0]);
  });

  it('invalidates bloque namespace after update cascade finishes', async () => {
    const { useCase, bloqueRepo, relationships, cache } = buildSystem();
    bloqueRepo.findById.mockResolvedValue(existingBloque);
    bloqueRepo.isCodeTaken.mockResolvedValue(false);
    bloqueRepo.update.mockResolvedValue({ id: 42 });

    await useCase.execute({ id: 42, input: { activo: false } });

    expect(relationships.markBloquesCascadeInactive).toHaveBeenCalledWith(42);
    expect(
      cache.invalidateNamespace.mock.invocationCallOrder[0],
    ).toBeGreaterThan(
      relationships.markBloquesCascadeInactive.mock.invocationCallOrder[0],
    );
  });

  it('does not invalidate bloque namespace when update fails', async () => {
    const { useCase, bloqueRepo, cache } = buildSystem();
    bloqueRepo.findById.mockResolvedValue(existingBloque);
    bloqueRepo.isCodeTaken.mockResolvedValue(false);
    const error = new Error('DB error');
    bloqueRepo.update.mockRejectedValue(error);

    await expect(
      useCase.execute({ id: 42, input: { nombre: 'Bloque Renovado' } }),
    ).rejects.toThrow(error);

    expect(cache.invalidateNamespace).not.toHaveBeenCalled();
  });
});

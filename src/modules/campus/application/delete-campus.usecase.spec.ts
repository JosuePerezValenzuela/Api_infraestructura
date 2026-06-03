// Este archivo contiene las pruebas del caso de uso DeleteCampusUseCase.

import { ConflictException, NotFoundException } from '@nestjs/common';
import { DeleteCampusUseCase } from './delete-campus.usecase';
import type {
  CampusListItem,
  CampusRepositoryPort,
  RelatedFaculty,
} from '../domain/campus.repository.port';

// Definimos la forma del repositorio falso que utilizaremos en las pruebas.
interface FakeCampusRepositoryPort {
  findById: jest.Mock<Promise<CampusListItem | null>, [number]>;
  findRelatedFaculties: jest.Mock<Promise<RelatedFaculty[]>, [number]>;
  delete: jest.Mock<Promise<{ id: number }>, [number]>;
}

describe('DeleteCampusUseCase', () => {
  // Función auxiliar que construye el sistema bajo prueba con dependencias simuladas.
  const buildSystem = () => {
    // Creamos un repositorio falso con todos los métodos necesarios.
    const campusRepo: FakeCampusRepositoryPort = {
      findById: jest.fn(),
      findRelatedFaculties: jest.fn(),
      delete: jest.fn(),
    };

    // Instanciamos el caso de uso real inyectando el mock.
    const useCase = new (DeleteCampusUseCase as any)(
      campusRepo as unknown as CampusRepositoryPort,
    );

    return { campusRepo, useCase };
  };

  // Esta prueba cubre el flujo feliz: el campus existe, no tiene facultades relacionadas y se elimina físicamente.
  it('hace delete físico cuando el campus existe y no tiene facultades relacionadas', async () => {
    const { campusRepo, useCase } = buildSystem();

    // Simulamos que el campus existe.
    campusRepo.findById.mockResolvedValue({
      id: 25,
      codigo: 'CAMP-025',
      nombre: 'Campus Central',
      direccion: 'Av. Principal 123',
      lat: -17.38,
      lng: -66.16,
      activo: true,
      creado_en: new Date('2025-01-01T10:00:00Z'),
      actualizado_en: new Date('2025-01-10T12:00:00Z'),
    });

    // Simulamos que no hay facultades relacionadas.
    campusRepo.findRelatedFaculties.mockResolvedValue([]);

    // Ejecutamos el caso de uso y esperamos el id del campus eliminado.
    await expect(useCase.execute({ id: 25 })).resolves.toEqual({ id: 25 });

    // Verificamos que se consultó el campus.
    expect(campusRepo.findById).toHaveBeenCalledTimes(1);
    expect(campusRepo.findById).toHaveBeenCalledWith(25);

    // Verificamos que se consultó las facultades relacionadas.
    expect(campusRepo.findRelatedFaculties).toHaveBeenCalledTimes(1);
    expect(campusRepo.findRelatedFaculties).toHaveBeenCalledWith(25);

    // Verificamos que se ejecutó el delete físico.
    expect(campusRepo.delete).toHaveBeenCalledTimes(1);
    expect(campusRepo.delete).toHaveBeenCalledWith(25);
  });

  // Esta prueba valida que cuando el campus no existe se lanza NotFoundException.
  it('lanza NotFoundException cuando el campus no existe', async () => {
    const { campusRepo, useCase } = buildSystem();

    // Configuramos el repositorio para devolver null.
    campusRepo.findById.mockResolvedValue(null);

    // Ejecutamos el caso de uso y confirmamos que recibe la excepción esperada.
    await expect(useCase.execute({ id: 404 })).rejects.toBeInstanceOf(
      NotFoundException,
    );

    // Validamos que no se llama a findRelatedFaculties ni delete.
    expect(campusRepo.findRelatedFaculties).not.toHaveBeenCalled();
    expect(campusRepo.delete).not.toHaveBeenCalled();
  });

  // Esta prueba valida que cuando el campus tiene facultades relacionadas se lanza ConflictException.
  it('lanza ConflictException cuando el campus tiene facultades relacionadas', async () => {
    const { campusRepo, useCase } = buildSystem();

    // Simulamos que el campus existe.
    campusRepo.findById.mockResolvedValue({
      id: 25,
      codigo: 'CAMP-025',
      nombre: 'Campus Central',
      direccion: 'Av. Principal 123',
      lat: -17.38,
      lng: -66.16,
      activo: true,
      creado_en: new Date('2025-01-01T10:00:00Z'),
      actualizado_en: new Date('2025-01-10T12:00:00Z'),
    });

    // Simulamos que el campus tiene facultades relacionadas.
    const relatedFaculties: RelatedFaculty[] = [
      {
        id: 1,
        codigo: 'FAC-001',
        nombre: 'Facultad de Ingeniería',
        nombre_corto: 'Ing.',
        activo: true,
      },
      {
        id: 2,
        codigo: 'FAC-002',
        nombre: 'Facultad de Medicina',
        nombre_corto: 'Med.',
        activo: false,
      },
    ];
    campusRepo.findRelatedFaculties.mockResolvedValue(relatedFaculties);

    // Ejecutamos el caso de uso y verificamos que recibe ConflictException.
    await expect(useCase.execute({ id: 25 })).rejects.toBeInstanceOf(
      ConflictException,
    );

    // Verificamos el formato del error.
    const error = await useCase.execute({ id: 25 }).catch((e) => e);
    const response = error.getResponse() as any;
    expect(response.error).toBe('CONFLICT_ERROR');
    expect(response.message).toBe(
      'No se puede eliminar el campus porque tiene facultades relacionadas',
    );
    expect(response.details).toHaveLength(2);
    expect(response.details[0].faculty.id).toBe(1);
    expect(response.details[1].faculty.id).toBe(2);

    // Verificamos que NO se llama al delete.
    expect(campusRepo.delete).not.toHaveBeenCalled();
  });

  // Esta prueba demuestra que si el delete falla, el error se propaga.
  it('propaga el error cuando el delete falla', async () => {
    const { campusRepo, useCase } = buildSystem();

    // Simulamos que el campus existe.
    campusRepo.findById.mockResolvedValue({
      id: 88,
      codigo: 'CAMP-088',
      nombre: 'Campus Norte',
      direccion: 'Calle Falsa 456',
      lat: -17.4,
      lng: -66.2,
      activo: true,
      creado_en: new Date('2024-05-01T08:00:00Z'),
      actualizado_en: new Date('2024-06-01T09:30:00Z'),
    });

    // Simulamos que no tiene facultades relacionadas.
    campusRepo.findRelatedFaculties.mockResolvedValue([]);

    // Configuramos el delete para que lance un error.
    const failure = new Error('Fallo en la base de datos');
    campusRepo.delete.mockRejectedValue(failure);

    // Ejecutamos el caso de uso y verificamos que recibe el mismo error.
    await expect(useCase.execute({ id: 88 })).rejects.toThrow(failure);

    // Verificamos que se intentó ejecutar el delete.
    expect(campusRepo.delete).toHaveBeenCalledWith(88);
  });
});

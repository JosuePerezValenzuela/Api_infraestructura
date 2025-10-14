// Este archivo contiene las pruebas del caso de uso DeleteCampusUseCase y explica cada paso en detalle.

import { NotFoundException } from '@nestjs/common'; // Traemos la excepción que representa el campus no encontrado.
import { DeleteCampusUseCase } from './delete-campus.usecase'; // Importamos el caso de uso que vamos a probar.
import type {
  CampusListItem,
  CampusRepositoryPort,
} from '../domain/campus.repository.port'; // Importamos los tipos del puerto del dominio para reutilizarlos en los mocks.
import type { RelationshipsPort as RelationshipsPortContract } from '../../_shared/relationships/domain/relationships.port'; // Traemos el contrato del puerto global de relaciones.

// Definimos la forma del repositorio falso que utilizaremos en las pruebas.
interface FakeCampusRepositoryPort {
  // Método que busca un campus por su identificador y devuelve información básica o null si no existe.
  findById: jest.Mock<Promise<CampusListItem | null>, [number]>;
}

// Definimos la forma del puerto de relaciones falso para simular la eliminación en cascada.
interface FakeRelationshipsPort {
  // Método que eliminará el campus y todas sus dependencias.
  deleteCampusCascade: jest.Mock<Promise<void>, [number]>;
}

describe('DeleteCampusUseCase', () => {
  // Función auxiliar que construye el sistema bajo prueba con dependencias simuladas.
  const buildSystem = () => {
    // Creamos un repositorio falso que nos permite controlar la respuesta de findById.
    const campusRepo: FakeCampusRepositoryPort = {
      findById: jest.fn(),
    };

    // Creamos el puerto de relaciones falso con la función que ejecuta la cascada de eliminación.
    const relationships: FakeRelationshipsPort = {
      deleteCampusCascade: jest.fn(),
    };

    // Instanciamos el caso de uso real inyectando los mocks como si fueran las dependencias verdaderas.
    const useCase = new (DeleteCampusUseCase as any)(
      campusRepo as unknown as CampusRepositoryPort,
      relationships as unknown as RelationshipsPortContract,
    );

    // Retornamos todas las piezas para reutilizarlas en cada prueba.
    return { campusRepo, relationships, useCase };
  };

  // Esta prueba cubre el flujo feliz: el campus existe y se elimina correctamente.
  it('invoca deleteCampusCascade cuando el campus existe', async () => {
    // Construimos el sistema con mocks controlados.
    const { campusRepo, relationships, useCase } = buildSystem();
    // Simulamos que el campus existe devolviendo un objeto con toda su información.
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
    // Indicamos que la eliminación en cascada se resuelve sin errores.
    relationships.deleteCampusCascade.mockResolvedValue(undefined);
    // Ejecutamos el caso de uso y esperamos recibir el identificador del campus eliminado.
    await expect(useCase.execute({ id: 25 })).resolves.toEqual({ id: 25 });
    // Verificamos que se consultó al repositorio con el identificador recibido.
    expect(campusRepo.findById).toHaveBeenCalledTimes(1);
    expect(campusRepo.findById).toHaveBeenCalledWith(25);
    // Comprobamos que el puerto global fue invocado para eliminar el campus y sus dependencias.
    expect(relationships.deleteCampusCascade).toHaveBeenCalledTimes(1);
    expect(relationships.deleteCampusCascade).toHaveBeenCalledWith(25);
  });

  // Esta prueba valida que cuando el campus no existe se lanza una NotFoundException y no se intenta eliminar nada.
  it('lanza NotFoundException cuando el campus no existe', async () => {
    // Construimos el sistema bajo prueba.
    const { campusRepo, relationships, useCase } = buildSystem();
    // Configuramos el repositorio para devolver null indicando que el campus no se encontró.
    campusRepo.findById.mockResolvedValue(null);
    // Ejecutamos el caso de uso y confirmamos que recibe la excepción esperada.
    await expect(useCase.execute({ id: 404 })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    // Validamos que en este escenario no se llama al puerto de eliminación en cascada.
    expect(relationships.deleteCampusCascade).not.toHaveBeenCalled();
  });

  // Esta prueba demuestra que si el puerto global falla, el error se propaga hacia el exterior.
  it('propaga el error cuando deleteCampusCascade falla', async () => {
    // Armamos el sistema con los mocks.
    const { campusRepo, relationships, useCase } = buildSystem();
    // Simulamos que el campus existe para que se intente eliminar.
    campusRepo.findById.mockResolvedValue({
      id: 88,
      codigo: 'CAMP-088',
      nombre: 'Campus Norte',
      direccion: 'Calle Falsa 456',
      lat: -17.4,
      lng: -66.2,
      activo: false,
      creado_en: new Date('2024-05-01T08:00:00Z'),
      actualizado_en: new Date('2024-06-01T09:30:00Z'),
    });
    // Configuramos el puerto de relaciones para que lance un error simulando un fallo en la base de datos.
    const failure = new Error('Fallo en cascada');
    relationships.deleteCampusCascade.mockRejectedValue(failure);
    // Ejecutamos el caso de uso y verificamos que recibimos el mismo error.
    await expect(useCase.execute({ id: 88 })).rejects.toThrow(failure);
    // Corroboramos que se intentó ejecutar la cascada con el identificador correcto.
    expect(relationships.deleteCampusCascade).toHaveBeenCalledWith(88);
  });
});

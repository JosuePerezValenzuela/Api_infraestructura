// Este archivo contiene pruebas unitarias del caso de uso UpdateCampusUseCase.

import { NotFoundException } from '@nestjs/common';
import { UpdateCampusUseCase } from './update-campus.usecase';
import type {
  CampusListItem,
  CampusRepositoryPort,
} from '../domain/campus.repository.port';
import type { RelationshipsPort as RelationshipsPortContract } from '../../_shared/relationships/domain/relationships.port';

// Definimos una interfaz auxiliar que describe las funciones que vamos a simular del repositorio de campus.
interface FakeCampusRepositoryPort {
  // Metodo que buscara un campus por su identificador y nos devolvera informacion basica.
  findById: jest.Mock<Promise<CampusListItem | null>, [number]>;
  // Metodo que aplicara la actualizacion al campus guardando la informacion en la base de datos.
  update: jest.Mock<Promise<{ id: number }>, [number, any]>;
  // Metodo que revisa si existe otro campus con el mismo codigo para evitar duplicados.
  isCodeTaken: jest.Mock<Promise<boolean>, [string, number]>;
}

// Definimos una interfaz auxiliar que describe las funciones del puerto de relaciones.
interface FakeRelationshipsPort {
  // Metodo encargado de marcar inactivas todas las entidades dependientes de un campus.
  markCampusCascadeInactive: jest.Mock<Promise<void>, [number]>;
}

describe('UpdateCampusUseCase', () => {
  // Funcion de ayuda que monta el sistema bajo prueba con dependencias simuladas.
  const buildSystem = () => {
    const campusRepo: FakeCampusRepositoryPort = {
      findById: jest.fn(),
      update: jest.fn(),
      isCodeTaken: jest.fn(),
    };

    const relationships: FakeRelationshipsPort = {
      markCampusCascadeInactive: jest.fn(),
    };

    const useCase = new (UpdateCampusUseCase as any)(
      campusRepo as unknown as CampusRepositoryPort,
      relationships as unknown as RelationshipsPortContract,
    );

    return { useCase, campusRepo, relationships };
  };

  // Esta prueba representa la historia: "Como administrador, cuando desactivo un campus necesito que todas sus dependencias tambien queden inactivas".
  it('llama a markCampusCascadeInactive cuando el campo activo pasa a false', async () => {
    // Construimos el sistema con mocks controlables.
    const { useCase, campusRepo, relationships } = buildSystem();
    // Configuramos el repositorio para devolver un campus existente y activo.
    campusRepo.findById.mockResolvedValue({
      id: 77,
      codigo: 'CP-001',
      nombre: 'Campus Principal',
      direccion: 'Av. Siempre Viva 742',
      lat: -17.4,
      lng: -66.2,
      activo: true,
      creado_en: new Date(),
      actualizado_en: new Date(),
    });
    // Indicamos que no hay conflicto de codigo para esta actualizacion.
    campusRepo.isCodeTaken.mockResolvedValue(false);
    // Simulamos que la actualizacion se realiza con exito en el repositorio.
    campusRepo.update.mockResolvedValue({ id: 77 });
    // Ejecutamos el caso de uso solicitando que el campus pase a inactivo.
    await useCase.execute({ id: 77, data: { activo: false } });
    // Verificamos que el puerto de relaciones fue invocado exactamente una vez.
    expect(relationships.markCampusCascadeInactive).toHaveBeenCalledTimes(1);
    // Comprobamos que el metodo recibio el identificador correcto del campus.
    expect(relationships.markCampusCascadeInactive).toHaveBeenCalledWith(77);
    // Revisamos que el repositorio actualizo el campo activo a false.
    expect(campusRepo.update).toHaveBeenCalledWith(77, { activo: false });
  });

  // Esta prueba asegura que no disparamos la cascada cuando el campus permanece activo.
  it('no llama a markCampusCascadeInactive cuando activo permanece true', async () => {
    // Armamos el sistema bajo prueba.
    const { useCase, campusRepo, relationships } = buildSystem();
    // Simulamos que el campus existe y sigue activo.
    campusRepo.findById.mockResolvedValue({
      id: 55,
      codigo: 'CP-002',
      nombre: 'Campus Norte',
      direccion: 'Calle Principal 123',
      lat: -17.5,
      lng: -66.3,
      activo: true,
      creado_en: new Date(),
      actualizado_en: new Date(),
    });
    // No hay conflicto de codigo.
    campusRepo.isCodeTaken.mockResolvedValue(false);
    // El repositorio confirma la actualizacion.
    campusRepo.update.mockResolvedValue({ id: 55 });
    // Ejecutamos el caso de uso pasando activo en true.
    await useCase.execute({ id: 55, data: { activo: true } });
    // Confirmamos que nunca se invoco al puerto de relaciones porque no hubo un cambio a false.
    expect(relationships.markCampusCascadeInactive).not.toHaveBeenCalled();
  });

  // Esta prueba verifica que si el campus no existe seguimos recibiendo el mismo error previo.
  it('lanza NotFoundException cuando el campus no existe y no invoca la cascada', async () => {
    // Montamos el sistema.
    const { useCase, campusRepo, relationships } = buildSystem();
    // Configuramos el repositorio para indicar que el campus no fue hallado.
    campusRepo.findById.mockResolvedValue(null);
    // Ejecutamos el caso de uso esperando un error.
    await expect(
      useCase.execute({ id: 999, data: { activo: false } }),
    ).rejects.toBeInstanceOf(NotFoundException);
    // Verificamos que el puerto de relaciones nunca fue utilizado en este escenario erroneo.
    expect(relationships.markCampusCascadeInactive).not.toHaveBeenCalled();
  });
});

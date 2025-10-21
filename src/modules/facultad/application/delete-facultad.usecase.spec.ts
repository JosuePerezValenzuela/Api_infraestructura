// Archivo de pruebas para DeleteFacultadUseCase.

import { NotFoundException } from '@nestjs/common';
import { DeleteFacultadUseCase } from './delete-facultad.usecase';
import type { facultadCompleta } from '../domain/facultad.list.types';
import type { FacultadRepositoryPort } from '../domain/facultad.repository.port';
import type { RelationshipsPort } from '../../_shared/relationships/domain/relationships.port';

// Definimos la forma del repositorio simulado que usan las pruebas.
interface FakeFacultadRepository {
  // Metodo para buscar una facultad por su identificador numerico.
  findById: jest.Mock<Promise<facultadCompleta | null>, [number]>;
}

// Definimos la forma del puerto de relaciones simulado.
interface FakeRelationshipsPort {
  // Metodo que elimina la facultad y todo lo que dependa de ella.
  deleteFacultadCascade: jest.Mock<Promise<void>, [number]>;
}

describe('DeleteFacultadUseCase', () => {
  // Funcion auxiliar que arma el sistema de pruebas con dependencias simuladas.
  const buildSystem = () => {
    // Creamos el repositorio falso y guardamos sus funciones para controlarlas.
    const facultadRepo: FakeFacultadRepository = {
      findById: jest.fn(), // Esta funcion dira si la facultad existe o no.
    };

    // Creamos el puerto de relaciones falso para decidir como se comporta la cascada.
    const relationships: FakeRelationshipsPort = {
      deleteFacultadCascade: jest.fn(), // Esta funcion simula la eliminacion en cascada.
    };

    // Instanciamos el caso de uso real inyectando las dependencias simuladas.
    const useCase = new (DeleteFacultadUseCase as any)(
      facultadRepo as unknown as FacultadRepositoryPort, // Le damos el repositorio simulado.
      relationships as unknown as RelationshipsPort, // Le damos el puerto de relaciones simulado.
    );

    // Retornamos las piezas para reutilizarlas en cada prueba.
    return { facultadRepo, relationships, useCase };
  };

  it('elimina la facultad y sus dependencias cuando existe', async () => {
    // Armamos el sistema para esta prueba.
    const { facultadRepo, relationships, useCase } = buildSystem();
    // Indicamos que el repositorio encuentra la facultad con todos sus datos basicos.
    facultadRepo.findById.mockResolvedValue({
      id: 12,
      codigo: 'FCT-012',
      nombre: 'Facultad de Ciencias',
      nombre_corto: 'FC',
      lat: -17.389,
      lng: -66.156,
      activo: true,
      campus_id: 3,
    });
    // Indicamos que la eliminacion en cascada se ejecuta sin errores.
    relationships.deleteFacultadCascade.mockResolvedValue(undefined);
    // Verificamos que el caso de uso devuelve el identificador eliminado.
    await expect(useCase.execute({ id: 12 })).resolves.toEqual({ id: 12 });
    // Revisamos que primero consulto al repositorio con el identificador correcto.
    expect(facultadRepo.findById).toHaveBeenCalledWith(12);
    // Confirmamos que luego pidio eliminar en cascada con ese mismo identificador.
    expect(relationships.deleteFacultadCascade).toHaveBeenCalledWith(12);
  });

  it('lanza NotFoundException cuando la facultad no existe', async () => {
    // Armamos el sistema para esta prueba.
    const { facultadRepo, relationships, useCase } = buildSystem();
    // Esta vez el repositorio dira que la facultad no existe.
    facultadRepo.findById.mockResolvedValue(null);
    // Esperamos que el caso de uso rechace con la excepcion NotFoundException.
    await expect(useCase.execute({ id: 404 })).rejects.toThrow(
      NotFoundException,
    );
    // Confirmamos que no se intento eliminar en cascada nada inexistente.
    expect(relationships.deleteFacultadCascade).not.toHaveBeenCalled();
  });

  it('propaga el error cuando deleteFacultadCascade falla', async () => {
    // Armamos el sistema para esta prueba.
    const { facultadRepo, relationships, useCase } = buildSystem();
    // El repositorio informa que la facultad si existe.
    facultadRepo.findById.mockResolvedValue({
      id: 55,
      codigo: 'FCT-055',
      nombre: 'Facultad de Tecnologia',
      nombre_corto: 'TEC',
      lat: -17.4,
      lng: -66.2,
      activo: false,
      campus_id: 9,
    });
    // Simulamos un error que podria ocurrir dentro de la base de datos.
    const failure = new Error('Fallo en la cascada');
    // Hacemos que la eliminacion en cascada devuelva ese error.
    relationships.deleteFacultadCascade.mockRejectedValue(failure);
    // Esperamos que el caso de uso deje pasar el error hacia quien lo invoca.
    await expect(useCase.execute({ id: 55 })).rejects.toThrow(failure);
    // Revisamos que el intento de borrar en cascada uso el identificador correcto.
    expect(relationships.deleteFacultadCascade).toHaveBeenCalledWith(55);
  });
});

// En este archivo escribimos las pruebas del caso de uso DeleteTipoBloqueUseCase explicando cada paso para principiantes.
// Importamos NotFoundException porque el caso de uso debe lanzarla cuando el registro no existe.
import { NotFoundException } from '@nestjs/common';
// Importamos la clase DeleteTipoBloqueUseCase (que implementaremos después) para definir su comportamiento esperado.
import { DeleteTipoBloqueUseCase } from './delete-tipo-bloque.usecase';
// Importamos el tipo de dominio que representa un tipo de bloque para simular la respuesta del repositorio.
import { TipoBloqueListItem } from '../domain/tipo-bloque.list.types';

// Definimos la interface del repositorio falso que usaremos en las pruebas.
interface FakeTipoBloqueRepositoryPort {
  // findById devuelve el registro si existe o null cuando no se encuentra.
  findById: jest.Mock<Promise<TipoBloqueListItem | null>, [number]>;
}

// Definimos la interface del puerto de relaciones falso que hará la eliminación en cascada simulada.
interface FakeRelationshipsPort {
  // deleteTipoBloqueCascade elimina el tipo de bloque y sus dependencias cuando existe.
  deleteTipoBloqueCascade: jest.Mock<Promise<void>, [number]>;
}

// Creamos una función auxiliar para construir el sistema bajo prueba con configuraciones personalizadas.
const buildSystem = (options?: {
  existing?: TipoBloqueListItem | null;
  cascadeError?: Error;
}) => {
  // Definimos un tipo de bloque de ejemplo que se usará cuando la prueba no especifique uno.
  const defaultTipoBloque: TipoBloqueListItem = {
    id: 25,
    nombre: 'Bloque modular',
    descripcion: 'Estructura desmontable para aulas temporales',
    activo: true,
    creado_en: new Date('2025-01-10T12:00:00.000Z'),
    actualizado_en: new Date('2025-02-15T09:30:00.000Z'),
  };
  // Determinamos si la prueba quiere simular un registro existente distinto o incluso nulo.
  const hasExisting = options ? 'existing' in options : false;
  // Si la prueba especifica existing respetamos ese valor (aunque sea null); caso contrario usamos el default.
  const existing = hasExisting
    ? (options!.existing ?? null)
    : defaultTipoBloque;
  // Tomamos el error opcional que la prueba desea que lance la eliminación en cascada.
  const cascadeError = options?.cascadeError;
  // Creamos el repositorio falso configurando findById para devolver el registro correspondiente.
  const repo: FakeTipoBloqueRepositoryPort = {
    findById: jest.fn().mockResolvedValue(existing),
  };
  // Creamos el puerto de relaciones falso y lo configuramos para fallar solo si la prueba lo solicita.
  const relationships: FakeRelationshipsPort = {
    deleteTipoBloqueCascade: cascadeError
      ? jest.fn().mockRejectedValue(cascadeError)
      : jest.fn().mockResolvedValue(undefined),
  };
  // Instanciamos el caso de uso pasando ambos puertos falsos.
  const useCase = new DeleteTipoBloqueUseCase(
    repo as unknown as any,
    relationships as unknown as any,
  );
  // Retornamos las dependencias para que cada prueba pueda inspeccionarlas.
  return {
    useCase,
    repo,
    relationships,
    existing: existing ?? defaultTipoBloque,
  };
};

// Agrupamos las pruebas del caso de uso dentro de describe para mantenerlas organizadas.
describe('DeleteTipoBloqueUseCase', () => {
  // Este escenario feliz confirma que eliminamos el tipo de bloque cuando existe y retornamos su id.
  it('elimina un tipo de bloque existente ejecutando la cascada y devolviendo su id', async () => {
    // Construimos el sistema con el registro por defecto.
    const { useCase, repo, relationships, existing } = buildSystem();
    // Definimos la entrada con el id del tipo de bloque a eliminar.
    const input = { id: existing.id };
    // Ejecutamos el caso de uso para iniciar la eliminación.
    const result = await useCase.execute(input);
    // Verificamos que el repositorio consultó la existencia del tipo de bloque.
    expect(repo.findById).toHaveBeenCalledWith(existing.id);
    // Confirmamos que se invocó la eliminación en cascada con el mismo identificador.
    expect(relationships.deleteTipoBloqueCascade).toHaveBeenCalledWith(
      existing.id,
    );
    // Validamos que el caso de uso devuelva el id eliminado como respuesta.
    expect(result).toEqual({ id: existing.id });
  });

  // Esta prueba valida que se lance NotFoundException cuando el tipo de bloque no existe.
  it('lanza NotFoundException si el tipo de bloque indicado no existe', async () => {
    // Construimos el sistema simulando que findById devuelve null.
    const { useCase, repo, relationships } = buildSystem({ existing: null });
    // Definimos la entrada con un id inexistente.
    const input = { id: 999 };
    // Ejecutamos el caso de uso esperando que rechace con NotFoundException.
    await expect(useCase.execute(input)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    // Verificamos que se consultó el repositorio con el id solicitado.
    expect(repo.findById).toHaveBeenCalledWith(999);
    // Aseguramos que no se intentó eliminar en cascada porque el registro no existe.
    expect(relationships.deleteTipoBloqueCascade).not.toHaveBeenCalled();
  });

  // Esta prueba cubre que cualquier error de la capa de relaciones se propague hacia el consumidor.
  it('propaga el error si la eliminación en cascada falla inesperadamente', async () => {
    // Creamos un error personalizado para comprobar que el caso de uso lo retransmite.
    const cascadeError = new Error('Fallo en cascada');
    // Construimos el sistema indicando que la eliminación en cascada fallará.
    const { useCase, repo, relationships, existing } = buildSystem({
      cascadeError,
    });
    // Definimos la entrada usando el id del registro existente.
    const input = { id: existing.id };
    // Ejecutamos el caso de uso y verificamos que rechaza con el mismo error.
    await expect(useCase.execute(input)).rejects.toBe(cascadeError);
    // Confirmamos que findById se llamó correctamente antes del fallo.
    expect(repo.findById).toHaveBeenCalledWith(existing.id);
    // Validamos que la cascada se intentó realizar con el id correcto.
    expect(relationships.deleteTipoBloqueCascade).toHaveBeenCalledWith(
      existing.id,
    );
  });
});

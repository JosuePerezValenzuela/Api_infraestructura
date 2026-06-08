// En este archivo escribimos las pruebas del caso de uso DeleteTipoBloqueUseCase explicando cada paso para principiantes.
// Importamos NotFoundException porque el caso de uso debe lanzarla cuando el registro no existe.
import { NotFoundException } from '@nestjs/common';
// Importamos la clase DeleteTipoBloqueUseCase (que implementaremos después) para definir su comportamiento esperado.
import { DeleteTipoBloqueUseCase } from './delete-tipo-bloque.usecase';
// Importamos el CacheService para simular el servicio de cache en las pruebas.
import { CacheService } from '../../_shared/infrastructure/cache/cache.service';
// Importamos el tipo de dominio que representa un tipo de bloque para simular la respuesta del repositorio.
import { TipoBloqueListItem } from '../domain/tipo-bloque.list.types';

// Definimos la interface del repositorio falso que usaremos en las pruebas.
interface FakeTipoBloqueRepositoryPort {
  // findById devuelve el registro si existe o null cuando no se encuentra.
  findById: jest.Mock<Promise<TipoBloqueListItem | null>, [number]>;
  // findRelatedBloques devuelve los bloques relacionados con este tipo.
  findRelatedBloques: jest.Mock<Promise<any[]>, [number]>;
  // delete elimina el tipo de bloque y devuelve su id.
  delete: jest.Mock<Promise<{ id: number }>, [number]>;
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
    findRelatedBloques: jest.fn().mockResolvedValue([]),
    delete: jest
      .fn()
      .mockResolvedValue({ id: (existing ?? defaultTipoBloque).id }),
  };
  // Creamos el puerto de relaciones falso y lo configuramos para fallar solo si la prueba lo solicita.
  const relationships: FakeRelationshipsPort = {
    deleteTipoBloqueCascade: cascadeError
      ? jest.fn().mockRejectedValue(cascadeError)
      : jest.fn().mockResolvedValue(undefined),
  };
  // Creamos un cache falso para espiar llamadas a invalidateNamespace.
  const cache = {
    getOrSet: jest.fn().mockResolvedValue(undefined),
    invalidate: jest.fn().mockResolvedValue(undefined),
    invalidateNamespace: jest.fn().mockResolvedValue(undefined),
  } as unknown as CacheService;
  // Instanciamos el caso de uso pasando los puertos falsos y el cache falso.
  const useCase = new DeleteTipoBloqueUseCase(
    repo as unknown as any,
    relationships as unknown as any,
    cache,
  );
  // Retornamos las dependencias para que cada prueba pueda inspeccionarlas.
  return {
    useCase,
    repo,
    relationships,
    cache,
    existing: existing ?? defaultTipoBloque,
  };
};

// Agrupamos las pruebas del caso de uso dentro de describe para mantenerlas organizadas.
describe('DeleteTipoBloqueUseCase', () => {
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

  // ── Cache invalidation tests ───────────────────────────────────

  // Probamos que se invalida el cache despues de eliminar exitosamente.
  it('llama invalidateNamespace despues de eliminar exitosamente', async () => {
    // Construimos el sistema con un registro existente y sin bloques relacionados.
    const { useCase, cache, repo, existing } = buildSystem();
    // Ejecutamos la eliminacion.
    await useCase.execute({ id: existing.id });
    // Verificamos que el repositorio ejecuto la eliminacion.
    expect(repo.delete).toHaveBeenCalledWith(existing.id);
    // Verificamos que se invalido el namespace de tipo_bloque.
    expect(cache.invalidateNamespace).toHaveBeenCalledWith('tipo_bloque:*');
  });

  // Probamos que NO se invalida el cache cuando el tipo de bloque no existe.
  it('NO llama invalidateNamespace cuando el tipo de bloque no existe', async () => {
    // Construimos el sistema simulando que findById devuelve null.
    const { useCase, cache } = buildSystem({ existing: null });
    // Ejecutamos con un id inexistente y esperamos NotFoundException.
    await expect(useCase.execute({ id: 999 })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    // Verificamos que NO se invalido el cache.
    expect(cache.invalidateNamespace).not.toHaveBeenCalled();
  });

  // Probamos que NO se invalida el cache cuando el repositorio lanza un error.
  it('NO llama invalidateNamespace cuando repo.delete lanza error', async () => {
    // Construimos el sistema con un registro existente.
    const { useCase, cache, repo, existing } = buildSystem();
    // Hacemos que repo.delete falle.
    const error = new Error('DB error');
    repo.delete.mockRejectedValue(error);
    // Ejecutamos y esperamos que el error se propague.
    await expect(useCase.execute({ id: existing.id })).rejects.toBe(error);
    // Verificamos que NO se invalido el cache porque nunca se completo la eliminacion.
    expect(cache.invalidateNamespace).not.toHaveBeenCalled();
  });
});

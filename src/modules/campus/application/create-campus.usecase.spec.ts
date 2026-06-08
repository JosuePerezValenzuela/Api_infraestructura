// Este archivo contiene pruebas unitarias del caso de uso CreateCampusUseCase.
// Cada prueba explica quÃ© comportamiento se espera, paso a paso.

import { CreateCampusUseCase } from './create-campus.usecase';
import { CampusRepositoryPort } from '../domain/campus.repository.port';
import { CacheService } from '../../_shared/infrastructure/cache/cache.service';

// Definimos la forma del repositorio falso que utilizaremos en las pruebas.
interface FakeCampusRepositoryPort {
  create: jest.Mock<
    Promise<{ id: number }>,
    [
      {
        nombre: string;
        codigo: string;
        direccion: string;
        lat: number;
        lng: number;
      },
    ]
  >;
}

describe('CreateCampusUseCase', () => {
  // FunciÃ³n auxiliar que construye el sistema bajo prueba con dependencias simuladas.
  const buildSystem = () => {
    // Creamos un repositorio falso que devuelve un id Ã©xito por defecto.
    const repo: FakeCampusRepositoryPort = {
      create: jest.fn().mockResolvedValue({ id: 42 }),
    };

    // Creamos un cache falso para espiar llamadas a invalidateNamespace.
    const cache = {
      getOrSet: jest.fn().mockResolvedValue(undefined),
      invalidate: jest.fn().mockResolvedValue(undefined),
      invalidateNamespace: jest.fn().mockResolvedValue(undefined),
    } as unknown as CacheService;

    // Instanciamos el caso de uso real inyectando los mocks.
    const useCase = new CreateCampusUseCase(
      repo as unknown as CampusRepositoryPort,
      cache,
    );

    return { useCase, repo, cache };
  };

  // ── Cache invalidation tests ───────────────────────────────────

  it('llama invalidateNamespace despuÃ©s de crear exitosamente', async () => {
    const { useCase, cache, repo } = buildSystem();

    await useCase.execute({
      nombre: 'Campus Norte',
      codigo: 'CN-001',
      direccion: 'Av. Principal 123',
      lat: -17.5,
      lng: -66.3,
    });

    // Verificamos que se llamÃ³ a create del repositorio.
    expect(repo.create).toHaveBeenCalled();
    // Verificamos que se invalidÃ³ el namespace de campus.
    expect(cache.invalidateNamespace).toHaveBeenCalledWith('campus:*');
  });

  it('NO llama invalidateNamespace cuando repo.create lanza error', async () => {
    const { useCase, cache, repo } = buildSystem();

    // Hacemos que repo.create falle con un error genÃ©rico de base de datos.
    const error = new Error('DB connection failed');
    repo.create.mockRejectedValue(error);

    // Ejecutamos con datos vÃ¡lidos pero el repositorio falla.
    await expect(
      useCase.execute({
        nombre: 'Campus Sur',
        codigo: 'CS-001',
        direccion: 'Av. Secundaria 456',
        lat: -17.6,
        lng: -66.4,
      }),
    ).rejects.toThrow();

    // Verificamos que NO se invalidÃ³ el cache porque nunca se completÃ³ la creaciÃ³n.
    expect(cache.invalidateNamespace).not.toHaveBeenCalled();
  });
});

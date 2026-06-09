// Estas pruebas describen el comportamiento del caso de uso CreateAmbienteUseCase paso a paso para que cualquier persona, incluso sin saber programar, pueda seguir la lógica y aprender junto a nosotros.
// Importamos las excepciones de NestJS que el caso de uso debe lanzar cuando detecta problemas en los datos recibidos.
import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
// Importamos el caso de uso que implementaremos después siguiendo las conductas declaradas en este archivo.
import { CreateAmbienteUseCase } from './create-ambiente.usecase';
// Importamos el comando del dominio que contendrá los datos mínimos que la capa de infraestructura necesita para crear un ambiente.
import { CreateAmbienteCommand } from '../domain/commands/create-ambiente.command';

// Definimos la forma del payload que llega desde la capa interfaz.
interface CreateAmbientePayload {
  nombre: string;
  nombre_corto?: string | null;
  codigo: string;
  piso: number;
  capacidad?: { total: number; examen: number };
  dimension?: {
    largo: number;
    ancho: number;
    alto: number;
    unid_med: 'metros';
  };
  clases: boolean;
  activo?: boolean;
  tipo_ambiente_id: number;
  bloque_id: number;
}

// El repositorio de ambientes será simulado con jest y debe exponer las mismas operaciones que la capa de infraestructura real.
interface AmbienteRepositoryPort {
  create: jest.Mock<Promise<{ id: number }>, [CreateAmbienteCommand]>;
  isCodeTaken: jest.Mock<Promise<boolean>, [string]>;
}

interface CacheServicePort {
  invalidateNamespace: jest.Mock<Promise<void>, [string]>;
}

// También simulamos los repositorios de bloque y tipo de ambiente para validar que existan las relaciones enviadas.
interface BloqueRepositoryPort {
  findById: jest.Mock<
    Promise<{ id: number; activo: boolean } | null>,
    [number]
  >;
}

interface TipoAmbienteRepositoryPort {
  findById: jest.Mock<
    Promise<{ id: number; activo: boolean } | null>,
    [number]
  >;
}

// Marcamos con Injectable una clase falsa que extiende al caso de uso para poder instanciarla aquí dentro de las pruebas.
@Injectable()
class FakeCreateAmbienteUseCase extends CreateAmbienteUseCase {}

describe('CreateAmbienteUseCase', () => {
  // Pequeña función de fábrica que arma el sistema bajo prueba con sus dependencias mockeadas.
  const buildSystem = (options?: {
    codeTaken?: boolean;
    bloqueExists?: boolean;
    bloqueActive?: boolean;
    tipoAmbienteExists?: boolean;
    tipoAmbienteActive?: boolean;
  }) => {
    const codeTaken = options?.codeTaken ?? false;
    const bloqueExists = options?.bloqueExists ?? true;
    const bloqueActive = options?.bloqueActive ?? true;
    const tipoAmbienteExists = options?.tipoAmbienteExists ?? true;
    const tipoAmbienteActive = options?.tipoAmbienteActive ?? true;

    const ambienteRepo: AmbienteRepositoryPort = {
      create: jest.fn().mockResolvedValue({ id: 44 }),
      isCodeTaken: jest.fn().mockResolvedValue(codeTaken),
    };

    const bloqueRepo: BloqueRepositoryPort = {
      findById: jest
        .fn()
        .mockResolvedValue(
          bloqueExists ? { id: 8, activo: bloqueActive } : null,
        ),
    };

    const tipoAmbienteRepo: TipoAmbienteRepositoryPort = {
      findById: jest
        .fn()
        .mockResolvedValue(
          tipoAmbienteExists ? { id: 5, activo: tipoAmbienteActive } : null,
        ),
    };

    const cacheService: CacheServicePort = {
      invalidateNamespace: jest.fn().mockResolvedValue(undefined),
    };

    const useCase = new FakeCreateAmbienteUseCase(
      ambienteRepo as unknown as any,
      bloqueRepo as unknown as any,
      tipoAmbienteRepo as unknown as any,
      cacheService as any,
    );

    return {
      useCase,
      ambienteRepo,
      bloqueRepo,
      tipoAmbienteRepo,
      cacheService,
    };
  };

  // Este payload base representa un ambiente válido que usaremos como referencia en la mayoría de escenarios.
  const basePayload: CreateAmbientePayload = {
    nombre: '  Laboratorio de Software  ',
    nombre_corto: '  Lab soft  ',
    codigo: '  LAB-SOFT-01  ',
    piso: 2,
    capacidad: { total: 40, examen: 25 },
    dimension: {
      largo: 8.5,
      ancho: 6.1,
      alto: 3.2,
      unid_med: 'metros',
    },
    clases: true,
    tipo_ambiente_id: 5,
    bloque_id: 8,
  };

  // Camino feliz: comprobamos que se cree un ambiente cuando todas las reglas se cumplen.
  it('crea un ambiente cuando los datos son validos', async () => {
    // Arrange: armamos el sistema con datos válidos.
    const { useCase, ambienteRepo, cacheService } = buildSystem();
    // Act: ejecutamos el caso de uso con el payload base.
    const result = await useCase.execute({ ...basePayload });
    // Assert: verificamos que el repositorio valide el código y reciba el comando correcto.
    expect(ambienteRepo.isCodeTaken).toHaveBeenCalledWith('LAB-SOFT-01');
    const expectedCommand: CreateAmbienteCommand = {
      nombre: 'Laboratorio de Software',
      nombre_corto: 'Lab soft',
      codigo: 'LAB-SOFT-01',
      piso: 2,
      capacidad: { total: 40, examen: 25 },
      dimension: {
        largo: 8.5,
        ancho: 6.1,
        alto: 3.2,
        unid_med: 'metros',
      },
      clases: true,
      activo: true,
      tipo_ambiente_id: 5,
      bloque_id: 8,
    };
    expect(ambienteRepo.create).toHaveBeenCalledWith(expectedCommand);
    expect(cacheService.invalidateNamespace).toHaveBeenCalledWith('ambiente:*');
    expect(result).toEqual({ id: 44 });
  });

  // Si el código ya existe debemos rechazar el proceso con una ConflictException.
  it('lanza ConflictException cuando el codigo ya existe', async () => {
    const { useCase, ambienteRepo, cacheService } = buildSystem({
      codeTaken: true,
    });
    await expect(useCase.execute({ ...basePayload })).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(ambienteRepo.create).not.toHaveBeenCalled();
    expect(cacheService.invalidateNamespace).not.toHaveBeenCalled();
  });

  // Validamos que no se permita crear ambientes sin un bloque asociado.
  it('lanza BadRequestException si el bloque no existe', async () => {
    const { useCase, bloqueRepo, ambienteRepo, cacheService } = buildSystem({
      bloqueExists: false,
    });
    await expect(useCase.execute({ ...basePayload })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(bloqueRepo.findById).toHaveBeenCalledWith(8);
    expect(ambienteRepo.create).not.toHaveBeenCalled();
    expect(cacheService.invalidateNamespace).not.toHaveBeenCalled();
  });

  // También bloqueamos la operación cuando el tipo de ambiente no se encuentra.
  it('lanza BadRequestException si el tipo de ambiente no existe', async () => {
    const { useCase, tipoAmbienteRepo, ambienteRepo, cacheService } =
      buildSystem({ tipoAmbienteExists: false });
    await expect(useCase.execute({ ...basePayload })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(tipoAmbienteRepo.findById).toHaveBeenCalledWith(5);
    expect(ambienteRepo.create).not.toHaveBeenCalled();
    expect(cacheService.invalidateNamespace).not.toHaveBeenCalled();
  });

  // La regla de negocio también exige que las relaciones estén activas, por lo que probamos ese comportamiento.
  it('lanza BadRequestException si el bloque esta inactivo', async () => {
    const { useCase, ambienteRepo, cacheService } = buildSystem({
      bloqueActive: false,
    });
    await expect(useCase.execute({ ...basePayload })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(ambienteRepo.create).not.toHaveBeenCalled();
    expect(cacheService.invalidateNamespace).not.toHaveBeenCalled();
  });

  it('lanza BadRequestException si el tipo de ambiente esta inactivo', async () => {
    const { useCase, ambienteRepo, cacheService } = buildSystem({
      tipoAmbienteActive: false,
    });
    await expect(useCase.execute({ ...basePayload })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(ambienteRepo.create).not.toHaveBeenCalled();
    expect(cacheService.invalidateNamespace).not.toHaveBeenCalled();
  });

  // Cuando el cliente no envía capacidad y dimensión debemos usar los valores por defecto definidos en la tabla.
  it('aplica los valores por defecto de capacidad y dimension cuando no se envian', async () => {
    const { useCase, ambienteRepo, cacheService } = buildSystem();
    const payloadSinOpcionales: CreateAmbientePayload = {
      ...basePayload,
      nombre_corto: undefined,
      capacidad: undefined,
      dimension: undefined,
      activo: undefined,
    };
    await useCase.execute(payloadSinOpcionales);
    expect(ambienteRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        capacidad: { total: 0, examen: 0 },
        dimension: {
          largo: 0,
          ancho: 0,
          alto: 0,
          unid_med: 'metros',
        },
        activo: true,
        nombre_corto: null,
      }),
    );
    expect(cacheService.invalidateNamespace).toHaveBeenCalledWith('ambiente:*');
  });

  // Probamos un error de validación cuando capacidad trae números negativos.
  it('lanza BadRequestException si la capacidad es invalida', async () => {
    const { useCase, ambienteRepo, cacheService } = buildSystem();
    const payload = {
      ...basePayload,
      capacidad: { total: -1, examen: 10 },
    };
    await expect(useCase.execute(payload)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(ambienteRepo.create).not.toHaveBeenCalled();
    expect(cacheService.invalidateNamespace).not.toHaveBeenCalled();
  });

  // Finalmente validamos que dimension solo acepte unidades permitidas.
  it('lanza BadRequestException si la dimension tiene unidades no soportadas', async () => {
    const { useCase, ambienteRepo, cacheService } = buildSystem();
    const payload = {
      ...basePayload,
      dimension: {
        largo: 8,
        ancho: 5,
        alto: 3,
        unid_med: 'yardas' as 'metros',
      },
    };
    await expect(useCase.execute(payload)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(ambienteRepo.create).not.toHaveBeenCalled();
    expect(cacheService.invalidateNamespace).not.toHaveBeenCalled();
  });
});

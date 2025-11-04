// Este archivo contiene las pruebas del caso de uso CreateBloqueUseCase y explica cada paso para que cualquier persona, incluso sin experiencia previa, pueda entenderlo.
// Importamos las excepciones de NestJS que usaremos para comprobar los errores que debe lanzar el caso de uso.
import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
// Importamos el valor objeto GeoPoint reutilizado en el dominio para validar y transformar coordenadas.
import { GeoPoint } from '../../_shared/domain/value-objects/geo-point.vo';
// Importamos el caso de uso (se implementará después siguiendo los comportamientos que declaramos aquí).
import { CreateBloqueUseCase } from './create-bloque.usecase';

// Definimos los tipos del comando que el caso de uso recibirá desde la capa interfaz.
interface CreateBloqueCommand {
  codigo: string;
  nombre: string;
  nombre_corto: string | null;
  lat: number;
  lng: number;
  pisos: number;
  activo?: boolean;
  facultad_id: number;
  tipo_bloque_id: number;
}

// Definimos interfaces simplificadas para las dependencias del caso de uso.
interface BloqueRepositoryPort {
  create: jest.Mock<
    Promise<{ id: number }>,
    [
      {
        codigo: string;
        nombre: string;
        nombre_corto: string | null;
        pointLiteral: string;
        pisos: number;
        activo: boolean;
        facultad_id: number;
        tipo_bloque_id: number;
      },
    ]
  >;
  isCodeTaken: jest.Mock<Promise<boolean>, [string]>;
}

interface FacultadRepositoryPort {
  findById: jest.Mock<Promise<{ id: number } | null>, [number]>;
}

interface TipoBloqueRepositoryPort {
  findById: jest.Mock<Promise<{ id: number } | null>, [number]>;
}

// El decorador Injectable nos permite extender la clase en el futuro si Nest la necesita, pero aquí solo lo documentamos.
@Injectable()
class FakeCreateBloqueUseCase extends CreateBloqueUseCase {}

// Agrupamos las pruebas bajo describe para mantener ordenado el comportamiento del caso de uso.
describe('CreateBloqueUseCase', () => {
  // Creamos una función auxiliar que construye el sistema bajo prueba parametrizado.
  const buildSystem = (options?: {
    codeTaken?: boolean;
    facultadExists?: boolean;
    tipoBloqueExists?: boolean;
  }) => {
    // Si no se proporcionan opciones usamos valores por defecto (nombre disponible y relaciones existentes).
    const codeTaken = options?.codeTaken ?? false;
    const facultadExists = options?.facultadExists ?? true;
    const tipoBloqueExists = options?.tipoBloqueExists ?? true;

    // Creamos mocks para cada repositorio que el caso de uso necesita.
    const bloqueRepo: BloqueRepositoryPort = {
      create: jest.fn().mockResolvedValue({ id: 10 }),
      isCodeTaken: jest.fn().mockResolvedValue(codeTaken),
    };

    const facultadRepo: FacultadRepositoryPort = {
      findById: jest.fn().mockResolvedValue(facultadExists ? { id: 7 } : null),
    };

    const tipoBloqueRepo: TipoBloqueRepositoryPort = {
      findById: jest
        .fn()
        .mockResolvedValue(tipoBloqueExists ? { id: 3 } : null),
    };

    // Instanciamos el caso de uso con las dependencias simuladas.
    const useCase = new FakeCreateBloqueUseCase(
      bloqueRepo as unknown as any,
      facultadRepo as unknown as any,
      tipoBloqueRepo as unknown as any,
    );

    // Retornamos todo para que cada prueba pueda inspeccionar las dependencias y el SUT.
    return { useCase, bloqueRepo, facultadRepo, tipoBloqueRepo };
  };

  // Definimos un comando base exitoso que reutilizaremos en varias pruebas.
  const baseCommand: CreateBloqueCommand = {
    codigo: '  BLOQUE-101  ',
    nombre: '  Bloque Central de Ingenieria  ',
    nombre_corto: '  Ing Central  ',
    lat: -17.3937,
    lng: -66.1568,
    pisos: 4,
    facultad_id: 1,
    tipo_bloque_id: 2,
  };

  // Esta prueba cubre el camino feliz donde todo es válido y se crea el bloque.
  it('crea un bloque cuando el payload es valido', async () => {
    const { useCase, bloqueRepo } = buildSystem();
    const result = await useCase.execute(baseCommand);

    // Verificamos que se haya normalizado el código y no existan duplicados.
    expect(bloqueRepo.isCodeTaken).toHaveBeenCalledWith('BLOQUE-101');
    // Confirmamos que GeoPoint se utilice para generar el literal de PostgreSQL.
    const expectedPoint = GeoPoint.create({
      lat: baseCommand.lat,
      lng: baseCommand.lng,
    }).toPostgresPointLiteral();

    expect(bloqueRepo.create).toHaveBeenCalledWith({
      codigo: 'BLOQUE-101',
      nombre: 'Bloque Central de Ingenieria',
      nombre_corto: 'Ing Central',
      pointLiteral: expectedPoint,
      pisos: 4,
      activo: true,
      facultad_id: 1,
      tipo_bloque_id: 2,
    });
    // El caso de uso debe devolver el id que entrega el repositorio.
    expect(result).toEqual({ id: 10 });
  });

  // Esta prueba comprueba que si el código ya existe se devuelva una ConflicException.
  it('lanza ConflictException cuando el codigo ya existe', async () => {
    const { useCase, bloqueRepo } = buildSystem({ codeTaken: true });
    await expect(useCase.execute(baseCommand)).rejects.toBeInstanceOf(
      ConflictException,
    );
    // Al detectarse el duplicado no debería intentar crear el registro.
    expect(bloqueRepo.create).not.toHaveBeenCalled();
  });

  // Validamos que el caso de uso exija la existencia de la facultad referenciada.
  it('lanza BadRequestException si la facultad no existe', async () => {
    const { useCase, facultadRepo, bloqueRepo } = buildSystem({
      facultadExists: false,
    });
    await expect(useCase.execute(baseCommand)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(facultadRepo.findById).toHaveBeenCalledWith(1);
    expect(bloqueRepo.create).not.toHaveBeenCalled();
  });

  // Validamos la existencia del tipo de bloque relacionado.
  it('lanza BadRequestException si el tipo de bloque no existe', async () => {
    const { useCase, tipoBloqueRepo, bloqueRepo } = buildSystem({
      tipoBloqueExists: false,
    });
    await expect(useCase.execute(baseCommand)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(tipoBloqueRepo.findById).toHaveBeenCalledWith(2);
    expect(bloqueRepo.create).not.toHaveBeenCalled();
  });

  // Probamos que se pueda desactivar el bloque enviando activo en false.
  it('respeta el valor del campo activo cuando viene en el comando', async () => {
    const { useCase, bloqueRepo } = buildSystem();
    const command = { ...baseCommand, activo: false };
    await useCase.execute(command);
    expect(bloqueRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ activo: false }),
    );
  });

  // Esta prueba cubre la validación de lat/lng usando GeoPoint y mapeando el error a BadRequestException.
  it('lanza BadRequestException cuando las coordenadas son invalidas', async () => {
    const { useCase, bloqueRepo } = buildSystem();
    // Usamos un valor imposible para provocar que GeoPoint falle.
    const command = { ...baseCommand, lat: 200 };
    await expect(useCase.execute(command)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(bloqueRepo.create).not.toHaveBeenCalled();
  });
});

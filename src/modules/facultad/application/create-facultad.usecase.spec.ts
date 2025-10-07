// Este archivo contiene las pruebas del caso de uso CreateFacultadUseCase y explica cada linea en lenguaje sencillo.
// Importamos las excepciones ConflictException y BadRequestException de Nest para comprobar errores especificos.
import { ConflictException, BadRequestException } from '@nestjs/common';
// Importamos CreateFacultadUseCase (que aun no existe) para describir el comportamiento deseado.
import { CreateFacultadUseCase } from './create-facultad.usecase';
// Importamos solo el tipo de CampusRepositoryPort para describir la forma del doble de prueba.
import type { CampusRepositoryPort as CampusRepositoryPortType } from '../../campus/domain/campus.repository.port';

// Definimos una interfaz local que describe como esperamos que sea el puerto de repositorio de facultades.
interface FakeFacultadRepositoryPort {
  // Metodo que debera crear la facultad en la base de datos.
  create: jest.Mock<
    Promise<{ id: number }>,
    [
      {
        codigo: string;
        nombre: string;
        nombre_corto: string | null;
        campus_id: number;
        pointLiteral: string;
      },
    ]
  >;
  // Metodo que verifica si un codigo esta ocupado.
  isCodeTaken: jest.Mock<Promise<boolean>, [string]>;
}

describe('CreateFacultadUseCase', () => {
  // Esta seccion configura un ayudante para crear el sistema bajo prueba con dobles de prueba controlables.
  const buildSystem = (options?: {
    codeTaken?: boolean;
    campusExists?: boolean;
  }) => {
    // Extraemos el indicador de codigo duplicado o usamos false por defecto.
    const codeTaken = options?.codeTaken ?? false;
    // Extraemos el indicador de existencia de campus o usamos true por defecto.
    const campusExists = options?.campusExists ?? true;
    // Creamos un repositorio falso de facultades con los metodos create e isCodeTaken controlables por Jest.
    const facultadRepo: FakeFacultadRepositoryPort = {
      create: jest.fn().mockResolvedValue({ id: 42 }),
      isCodeTaken: jest.fn().mockResolvedValue(codeTaken),
    };
    // Creamos un repositorio falso de campus siguiendo la interfaz real para garantizar compatibilidad futura.
    const campusRepo: CampusRepositoryPortType = {
      create: jest.fn() as unknown as CampusRepositoryPortType['create'],
      list: jest.fn() as unknown as CampusRepositoryPortType['list'],
      findById: jest.fn().mockResolvedValue(
        campusExists
          ? {
              id: 1,
              codigo: 'C-001',
              nombre: 'Campus Central',
              direccion: 'Direccion',
              lat: -17.39,
              lng: -66.15,
              activo: true,
              creado_en: new Date(),
              actualizado_en: new Date(),
            }
          : null,
      ) as unknown as CampusRepositoryPortType['findById'],
      isCodeTaken:
        jest.fn() as unknown as CampusRepositoryPortType['isCodeTaken'],
      update: jest.fn() as unknown as CampusRepositoryPortType['update'],
    };
    // Instanciamos el caso de uso pasando los puertos falsos para poder observar su comportamiento.
    const useCase = new CreateFacultadUseCase(
      facultadRepo as unknown as any,
      campusRepo,
    );
    // Retornamos todas las piezas para que cada prueba pueda inspeccionarlas.
    return { useCase, facultadRepo, campusRepo };
  };

  // Este caso cubre el registro exitoso de una nueva facultad cumpliendo el escenario principal de la HU.
  it('crea una facultad cuando los datos son validos y el campus existe', async () => {
    // Construimos el sistema con el campus existente y el codigo disponible.
    const { useCase, facultadRepo, campusRepo } = buildSystem();
    // Definimos los datos de entrada que simulan la peticion del administrador.
    const comando = {
      codigo: 'FCYT-01',
      nombre: 'Facultad de Ciencias y Tecnologia',
      nombre_corto: 'FCyT',
      lat: -17.3939,
      lng: -66.15,
      campus_id: 1,
    };
    // Ejecutamos el caso de uso con los datos de entrada.
    const resultado = await useCase.execute(comando);
    // Verificamos que el repositorio de campus haya sido consultado para asegurar que el campus existe.
    expect((campusRepo.findById as unknown as jest.Mock).mock.calls[0][0]).toBe(
      1,
    );
    // Confirmamos que se verifico la unicidad del codigo antes de crear la facultad.
    expect(facultadRepo.isCodeTaken).toHaveBeenCalledWith('FCYT-01');
    // Confirmamos que se invoco al metodo create del repositorio con los datos esperados.
    expect(facultadRepo.create).toHaveBeenCalledWith({
      codigo: 'FCYT-01',
      nombre: 'Facultad de Ciencias y Tecnologia',
      nombre_corto: 'FCyT',
      campus_id: 1,
      pointLiteral: '(-66.15,-17.3939)',
    });
    // Verificamos que el caso de uso devuelva el identificador proporcionado por el repositorio.
    expect(resultado).toEqual({ id: 42 });
  });

  // Este caso cubre el escenario de codigo duplicado descrito en el criterio de aceptacion 2.
  it('lanza ConflictException cuando el codigo ya esta registrado', async () => {
    // Construimos el sistema indicando que el codigo ya esta ocupado.
    const { useCase } = buildSystem({ codeTaken: true });
    // Definimos los datos validos de entrada.
    const comando = {
      codigo: 'FCYT-01',
      nombre: 'Facultad de Ciencias y Tecnologia',
      nombre_corto: 'FCyT',
      lat: -17.3939,
      lng: -66.15,
      campus_id: 1,
    };
    // Ejecutamos el caso de uso y esperamos que se rechace con una ConflictException.
    await expect(useCase.execute(comando)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  // Este caso cubre el escenario donde el campus solicitado no existe (criterio de aceptacion 6).
  it('lanza BadRequestException cuando el campus indicado no existe', async () => {
    // Construimos el sistema indicando que el campus no se encuentra.
    const { useCase } = buildSystem({ campusExists: false });
    // Definimos los datos validos de entrada.
    const comando = {
      codigo: 'FCYT-01',
      nombre: 'Facultad de Ciencias y Tecnologia',
      nombre_corto: 'FCyT',
      lat: -17.3939,
      lng: -66.15,
      campus_id: 999,
    };
    // Ejecutamos el caso de uso y esperamos un rechazo con BadRequestException.
    await expect(useCase.execute(comando)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});

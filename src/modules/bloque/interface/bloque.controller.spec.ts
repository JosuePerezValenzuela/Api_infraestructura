// En este archivo escribimos las pruebas del BloqueController y explicamos cada paso para que cualquier persona aprenda cómo funciona.
// Importamos helpers de Nest para crear un módulo de prueba donde podamos inyectar versiones falsas de los casos de uso.
import { Test, TestingModule } from '@nestjs/testing';
// Importamos las excepciones que esperamos que el controlador pueda propagar cuando el caso de uso detecta errores.
import { BadRequestException, ConflictException } from '@nestjs/common';
// Importamos el controlador que vamos a probar (su implementación vendrá después).
import { BloqueController } from './bloque.controller';
// Importamos el caso de uso que el controlador debe invocar al recibir una petición POST.
import { CreateBloqueUseCase } from '../application/create-bloque.usecase';
import { ListBloquesUseCase } from '../application/list-bloques.usecase';
// Importamos el DTO para que TypeScript conozca la forma del objeto que recibirá el controlador.
import { CreateBloqueDto } from './dto/create-bloque.dto';

// Creamos un tipo auxiliar que describe la forma del mock del caso de uso.
type CreateUseCaseMock = {
  // Definimos execute como un mock de Jest que recibe un comando y devuelve una Promesa con el id creado.
  execute: jest.Mock<Promise<{ id: number }>, [any]>;
};

type ListUseCaseMock = {
  execute: jest.Mock<Promise<any>, [any]>;
};

// Agrupamos todas las pruebas dentro de describe para mantener ordenado el comportamiento del controlador.
describe('BloqueController', () => {
  // Declaramos variables que inicializaremos antes de cada prueba.
  let controller: BloqueController;
  let createUseCase: CreateUseCaseMock;
  let listUseCase: ListUseCaseMock;

  // beforeEach se ejecuta antes de cada prueba y prepara un entorno limpio.
  beforeEach(async () => {
    // Creamos un mock para el caso de uso que podremos programar de acuerdo a cada escenario.
    createUseCase = { execute: jest.fn() };
    listUseCase = { execute: jest.fn() };

    // Construimos un módulo de prueba de Nest inyectando el controlador real y el mock del caso de uso.
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BloqueController],
      providers: [
        {
          provide: CreateBloqueUseCase,
          useValue: createUseCase,
        },
        {
          provide: ListBloquesUseCase,
          useValue: listUseCase,
        },
      ],
    }).compile();

    // Obtenemos el controlador desde el módulo para usarlo en las pruebas.
    controller = module.get<BloqueController>(BloqueController);
  });

  describe('findAll', () => {
    it('invoca el caso de uso con los filtros normalizados y devuelve el resultado', async () => {
      listUseCase.execute.mockResolvedValue({
        items: [],
        meta: {
          total: 0,
          page: 1,
          take: 8,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      });

      const result = await controller.findAll({});

      expect(listUseCase.execute).toHaveBeenCalledWith({
        page: 1,
        limit: 8,
        search: null,
        orderBy: 'nombre',
        orderDir: 'asc',
        facultadId: null,
        tipoBloqueId: null,
        activo: null,
        pisosMin: null,
        pisosMax: null,
      });
      expect(result.meta.total).toBe(0);
    });

    it('propaga BadRequestException cuando el caso de uso detecta filtros invalidos', async () => {
      listUseCase.execute.mockRejectedValue(
        new BadRequestException({
          error: 'VALIDATION_ERROR',
          message: 'Los datos enviados no son validos',
          details: [{ field: 'page', message: 'Debe ser >= 1' }],
        }),
      );

      await expect(controller.findAll({ page: 0 })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  // En este bloque describimos los escenarios relacionados con el método create del controlador.
  describe('create', () => {
    // Caso feliz: el controlador delega en el caso de uso y devuelve el id.
    it('devuelve el identificador cuando la creacion es exitosa', async () => {
      // Configuramos el mock para que el caso de uso responda con un id ficticio.
      createUseCase.execute.mockResolvedValue({ id: 55 });
      // Preparamos el DTO tal como lo enviaría el frontend.
      const dto: CreateBloqueDto = {
        codigo: 'BLOQUE-101',
        nombre: 'Bloque Central',
        nombre_corto: 'Central',
        lat: -17.3937,
        lng: -66.1568,
        pisos: 4,
        activo: true,
        facultad_id: 1,
        tipo_bloque_id: 2,
      };

      // Ejecutamos el método create del controlador simulando la petición HTTP.
      const result = await controller.create(dto);

      // Verificamos que el controlador haya delegado correctamente en el caso de uso con los mismos datos del DTO.
      expect(createUseCase.execute).toHaveBeenCalledWith({
        codigo: 'BLOQUE-101',
        nombre: 'Bloque Central',
        nombre_corto: 'Central',
        lat: -17.3937,
        lng: -66.1568,
        pisos: 4,
        activo: true,
        facultad_id: 1,
        tipo_bloque_id: 2,
      });
      // Confirmamos que el controlador devuelva la misma respuesta que entrega el caso de uso.
      expect(result).toEqual({ id: 55 });
    });

    // Este test demuestra que el controlador simplemente propaga los errores de conflicto del caso de uso.
    it('propaga ConflictException cuando el caso de uso detecta codigo duplicado', async () => {
      // Configuramos el mock para que rechace con ConflictException.
      createUseCase.execute.mockRejectedValue(
        new ConflictException('Ya existe un bloque con ese codigo'),
      );
      const dto: CreateBloqueDto = {
        codigo: 'BLOQUE-101',
        nombre: 'Bloque Central',
        nombre_corto: 'Central',
        lat: -17.3937,
        lng: -66.1568,
        pisos: 4,
        activo: true,
        facultad_id: 1,
        tipo_bloque_id: 2,
      };

      // Ejecutamos el método create esperando que la promesa se rechace con la misma excepción.
      await expect(controller.create(dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    // Finalmente verificamos que también se propaguen errores de validación (BadRequestException).
    it('propaga BadRequestException cuando los datos son invalidos', async () => {
      createUseCase.execute.mockRejectedValue(
        new BadRequestException({
          error: 'VALIDATION_ERROR',
          message: 'Los datos enviados no son validos',
          details: [{ field: 'facultad_id', message: 'La facultad no existe' }],
        }),
      );
      const dto: CreateBloqueDto = {
        codigo: 'BLOQUE-101',
        nombre: 'Bloque Central',
        nombre_corto: 'Central',
        lat: -17.3937,
        lng: -66.1568,
        pisos: 4,
        activo: true,
        facultad_id: 999,
        tipo_bloque_id: 2,
      };

      await expect(controller.create(dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });
});

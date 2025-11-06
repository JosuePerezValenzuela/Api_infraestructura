// En este archivo escribimos las pruebas del BloqueController y explicamos cada paso para que cualquier persona aprenda cómo funciona.
// Importamos helpers de Nest para crear un módulo de prueba donde podamos inyectar versiones falsas de los casos de uso.
import { Test, TestingModule } from '@nestjs/testing';
// Importamos las excepciones que esperamos que el controlador pueda propagar cuando un caso de uso detecta errores.
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
// Importamos el controlador que vamos a probar (su implementación vendrá después).
import { BloqueController } from './bloque.controller';
// Importamos los casos de uso que el controlador debe invocar para cada endpoint.
import { CreateBloqueUseCase } from '../application/create-bloque.usecase';
import { ListBloquesUseCase } from '../application/list-bloques.usecase';
import { UpdateBloqueUseCase } from '../application/update-bloque.usecase';
// Importamos los DTO que representan la forma de los datos que recibimos vía HTTP.
import { CreateBloqueDto } from './dto/create-bloque.dto';
import { UpdateBloqueDto } from './dto/update-bloque.dto';

// Creamos tipos auxiliares que describen los mocks de cada caso de uso.
type CreateUseCaseMock = {
  // Definimos execute como un mock de Jest que recibe un comando y devuelve una Promesa con el id creado.
  execute: jest.Mock<Promise<{ id: number }>, [any]>;
};

type ListUseCaseMock = {
  execute: jest.Mock<Promise<any>, [any]>;
};

type UpdateUseCaseMock = {
  // Este mock recibe el objeto con el id y el payload parcial que se enviará al caso de uso.
  execute: jest.Mock<Promise<{ id: number }>, [any]>;
};

// Agrupamos todas las pruebas dentro de describe para mantener ordenado el comportamiento del controlador.
describe('BloqueController', () => {
  // Declaramos variables que inicializaremos antes de cada prueba.
  let controller: BloqueController;
  let createUseCase: CreateUseCaseMock;
  let listUseCase: ListUseCaseMock;
  let updateUseCase: UpdateUseCaseMock;

  // beforeEach se ejecuta antes de cada prueba y prepara un entorno limpio.
  beforeEach(async () => {
    // Creamos mocks para cada caso de uso que podremos programar de acuerdo a cada escenario probado.
    createUseCase = { execute: jest.fn() };
    listUseCase = { execute: jest.fn() };
    updateUseCase = { execute: jest.fn() };

    // Construimos un módulo de prueba de Nest inyectando el controlador real y los mocks de los casos de uso.
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
        {
          provide: UpdateBloqueUseCase,
          useValue: updateUseCase,
        },
      ],
    }).compile();

    // Obtenemos el controlador desde el módulo para usarlo en las pruebas.
    controller = module.get<BloqueController>(BloqueController);
  });

  describe('findAll', () => {
    it('invoca el caso de uso con los filtros normalizados y devuelve el resultado', async () => {
      // Simulamos que el caso de uso devuelve una respuesta paginada vacía (camino feliz).
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

      // Llamamos al método findAll sin filtros para que el controlador use los valores por defecto.
      const result = await controller.findAll({});

      // Verificamos que el caso de uso reciba los filtros normalizados (page=1, limit=8, etc.).
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
      // Confirmamos que el resultado es exactamente lo que devolvió el caso de uso.
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

      // Esperamos que el controlador propague la excepción tal cual.
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
    it('propaga ConflictException cuando el caso de uso detecta código duplicado', async () => {
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
    it('propaga BadRequestException cuando los datos son inválidos', async () => {
      createUseCase.execute.mockRejectedValue(
        new BadRequestException({
          error: 'VALIDATION_ERROR',
          message: 'Los datos enviados no son validos',
          details: [
            { field: 'facultad_id', message: 'La facultad indicada no existe' },
          ],
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

  // Este bloque contiene los escenarios para el endpoint PATCH /bloques/:id.
  describe('update', () => {
    // Caso feliz: devolvemos el id actualizado y delegamos correctamente en el caso de uso.
    it('delega la actualización al caso de uso y devuelve el id', async () => {
      // Programamos el mock para que el caso de uso informe éxito devolviendo el id del bloque.
      updateUseCase.execute.mockResolvedValue({ id: 42 });
      // Construimos un DTO parcial con los cambios solicitados por el cliente.
      const dto: UpdateBloqueDto = {
        nombre: 'Bloque actualizado',
        activo: true,
      };

      // Invocamos el método del controlador simulando el PATCH /bloques/42.
      const result = await controller.update(42, dto);

      // El controlador debe llamar al caso de uso con el id y el payload sin modificar.
      expect(updateUseCase.execute).toHaveBeenCalledWith({
        id: 42,
        input: dto,
      });
      // La respuesta HTTP debe reflejar el id que retorna el caso de uso.
      expect(result).toEqual({ id: 42 });
    });

    // Este test verifica que propagamos los errores de validación que reporte el caso de uso.
    it('propaga BadRequestException cuando el caso de uso detecta datos inválidos', async () => {
      updateUseCase.execute.mockRejectedValue(
        new BadRequestException({
          error: 'VALIDATION_ERROR',
          message: 'Los datos enviados no son validos',
          details: [
            {
              field: 'lat/lng',
              message: 'Debes enviar lat y lng juntos',
            },
          ],
        }),
      );

      await expect(
        controller.update(15, { lat: -17.3 }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    // También propagamos conflictos cuando el caso de uso identifica un código duplicado.
    it('propaga ConflictException cuando el caso de uso detecta un código duplicado', async () => {
      updateUseCase.execute.mockRejectedValue(
        new ConflictException('Ya existe un bloque con ese código'),
      );

      await expect(
        controller.update(15, { codigo: 'BLOQUE-101' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    // Verificamos que cuando el caso de uso indica que el bloque no existe se propague el 404.
    it('propaga NotFoundException cuando el bloque no existe', async () => {
      updateUseCase.execute.mockRejectedValue(
        new NotFoundException('No se encontro el bloque'),
      );

      await expect(controller.update(999, {})).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});

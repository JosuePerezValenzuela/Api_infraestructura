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
import { DeleteBloqueUseCase } from '../application/delete-bloque.usecase';
// Importamos los DTO que representan la forma de los datos que recibimos vía HTTP.
import { CreateBloqueDto } from './dto/create-bloque.dto';
import { UpdateBloqueDto } from './dto/update-bloque.dto';

// Creamos tipos auxiliares que describen los mocks de cada caso de uso.
type CreateUseCaseMock = {
  execute: jest.Mock<Promise<{ id: number }>, [any]>;
};

type ListUseCaseMock = {
  execute: jest.Mock<Promise<any>, [any]>;
};

type UpdateUseCaseMock = {
  execute: jest.Mock<Promise<{ id: number }>, [any]>;
};

type DeleteUseCaseMock = {
  execute: jest.Mock<Promise<void | { id: number }>, [any]>;
};

describe('BloqueController', () => {
  let controller: BloqueController;
  let createUseCase: CreateUseCaseMock;
  let listUseCase: ListUseCaseMock;
  let updateUseCase: UpdateUseCaseMock;
  let deleteUseCase: DeleteUseCaseMock;

  beforeEach(async () => {
    createUseCase = { execute: jest.fn() };
    listUseCase = { execute: jest.fn() };
    updateUseCase = { execute: jest.fn() };
    deleteUseCase = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BloqueController],
      providers: [
        { provide: CreateBloqueUseCase, useValue: createUseCase },
        { provide: ListBloquesUseCase, useValue: listUseCase },
        { provide: UpdateBloqueUseCase, useValue: updateUseCase },
        { provide: DeleteBloqueUseCase, useValue: deleteUseCase },
      ],
    }).compile();

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

    it('propaga BadRequestException cuando el caso de uso detecta filtros inválidos', async () => {
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

  describe('create', () => {
    it('devuelve el identificador cuando la creación es exitosa', async () => {
      createUseCase.execute.mockResolvedValue({ id: 55 });
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

      const result = await controller.create(dto);

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
      expect(result).toEqual({ id: 55 });
    });

    it('propaga ConflictException cuando el caso de uso detecta código duplicado', async () => {
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

      await expect(controller.create(dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

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

  describe('update', () => {
    it('delega la actualización al caso de uso y devuelve el id', async () => {
      updateUseCase.execute.mockResolvedValue({ id: 42 });
      const dto: UpdateBloqueDto = {
        nombre: 'Bloque actualizado',
        activo: true,
      };

      const result = await controller.update(42, dto);

      expect(updateUseCase.execute).toHaveBeenCalledWith({
        id: 42,
        input: dto,
      });
      expect(result).toEqual({ id: 42 });
    });

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

    it('propaga ConflictException cuando el caso de uso detecta un código duplicado', async () => {
      updateUseCase.execute.mockRejectedValue(
        new ConflictException('Ya existe un bloque con ese código'),
      );

      await expect(
        controller.update(15, { codigo: 'BLOQUE-101' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('propaga NotFoundException cuando el bloque no existe', async () => {
      updateUseCase.execute.mockRejectedValue(
        new NotFoundException('No se encontro el bloque'),
      );

      await expect(controller.update(999, {})).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('invoca al caso de uso y devuelve void con estado 204', async () => {
      deleteUseCase.execute.mockResolvedValue({ id: 77 });

      await controller.delete(77);

      expect(deleteUseCase.execute).toHaveBeenCalledWith({ id: 77 });
    });

    it('propaga NotFoundException cuando el caso de uso indica que el bloque no existe', async () => {
      deleteUseCase.execute.mockRejectedValue(
        new NotFoundException('No se encontro el bloque'),
      );

      await expect(controller.delete(123)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});

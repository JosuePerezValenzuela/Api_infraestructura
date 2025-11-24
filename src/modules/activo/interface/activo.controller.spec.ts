// En este archivo explicamos el comportamiento esperado de ActivoController.
// Cada prueba describe la historia completa para que alguien sin experiencia entienda la API.

import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ActivoController } from './activo.controller';
import { ListActivosUseCase } from '../application/list-activos.usecase';
import { ListActivosQueryDto } from './dto/list-activos-query.dto';
import { ListActivosResult } from '../domain/activo.list.types';
import { CreateActivoUseCase } from '../application/create-activo.usecase';
import { CreateActivoDto } from './dto/create-activo.dto';
import { DeleteActivoUseCase } from '../application/delete-activo.usecase';
import { UpdateActivoUseCase } from '../application/update-activo.usecase';
import { UpdateActivoDto } from './dto/update-activo.dto';

// Definimos el tipo del mock para el caso de uso de listado.
type ListUseCaseMock = {
  execute: jest.Mock<Promise<ListActivosResult>, [any]>;
};
// Definimos el tipo del mock para el caso de uso de creacion.
type CreateUseCaseMock = {
  execute: jest.Mock<Promise<{ id: number }>, [any]>;
};
// Definimos el tipo del mock para el caso de uso de eliminacion.
type DeleteUseCaseMock = {
  execute: jest.Mock<Promise<{ id: number }>, [any]>;
};
// Definimos el tipo del mock para el caso de uso de actualizacion.
type UpdateUseCaseMock = {
  execute: jest.Mock<Promise<{ id: number }>, [any]>;
};

describe('ActivoController', () => {
  let controller: ActivoController;
  let listUseCase: ListUseCaseMock;
  let createUseCase: CreateUseCaseMock;
  let deleteUseCase: DeleteUseCaseMock;
  let updateUseCase: UpdateUseCaseMock;

  // Antes de cada prueba armamos el modulo de testing con el controlador real y los casos de uso simulados.
  beforeEach(async () => {
    listUseCase = { execute: jest.fn() };
    createUseCase = { execute: jest.fn() };
    deleteUseCase = { execute: jest.fn() };
    updateUseCase = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActivoController],
      providers: [
        { provide: ListActivosUseCase, useValue: listUseCase },
        { provide: CreateActivoUseCase, useValue: createUseCase },
        { provide: DeleteActivoUseCase, useValue: deleteUseCase },
        { provide: UpdateActivoUseCase, useValue: updateUseCase },
      ],
    }).compile();

    controller = module.get<ActivoController>(ActivoController);
  });

  describe('findAll', () => {
    it('normaliza filtros por defecto y llama al caso de uso', async () => {
      // Arrange: preparamos un resultado vacio que el mock devolvera.
      const emptyResult: ListActivosResult = {
        items: [],
        meta: {
          total: 0,
          page: 1,
          take: 8,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
      listUseCase.execute.mockResolvedValue(emptyResult);

      // Act: invocamos el controlador sin filtros.
      const result = await controller.findAll({} as ListActivosQueryDto);

      // Assert: el caso de uso recibe undefined/null para que aplique sus defaults.
      expect(listUseCase.execute).toHaveBeenCalledWith({
        page: undefined,
        limit: undefined,
        search: undefined,
        orderBy: undefined,
        orderDir: undefined,
        ambienteId: undefined,
      });
      // Tambien comprobamos que la respuesta se devuelve tal cual.
      expect(result).toEqual(emptyResult);
    });

    it('propaga BadRequestException cuando el caso de uso lo indica', async () => {
      // Arrange: configuramos el mock para rechazar con la excepcion esperada.
      listUseCase.execute.mockRejectedValue(
        new BadRequestException({
          error: 'VALIDATION_ERROR',
          message: 'Los datos enviados no son validos',
          details: [{ field: 'page', message: 'Debe ser >= 1' }],
        }),
      );

      // Act & Assert: la llamada debe rechazar y mantener el tipo de error.
      await expect(
        controller.findAll({ page: 0 } as ListActivosQueryDto),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('create', () => {
    it('llama al caso de uso con el payload y devuelve el id', async () => {
      // Arrange: configuramos el mock para devolver un id.
      createUseCase.execute.mockResolvedValue({ id: 55 });
      const dto: CreateActivoDto = {
        nia: 'NIA-2000',
        nombre: 'Switch',
        descripcion: '24 puertos',
        ambiente_id: 3,
      };

      // Act: invocamos el controlador.
      const result = await controller.create(dto);

      // Assert: el caso de uso recibe el dto tal cual.
      expect(createUseCase.execute).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ id: 55 });
    });

    it('propaga BadRequestException cuando el caso de uso lo indica', async () => {
      // Arrange: el mock rechazara con error de validacion.
      createUseCase.execute.mockRejectedValue(
        new BadRequestException({
          error: 'VALIDATION_ERROR',
          message: 'Los datos enviados no son validos',
          details: [{ field: 'nia', message: 'Requerido' }],
        }),
      );

      // Act & Assert: esperamos que el controlador propague el error.
      await expect(
        controller.create({} as CreateActivoDto),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('propaga ConflictException cuando el NIA esta duplicado', async () => {
      // Arrange: el mock simula un conflicto por NIA duplicado.
      createUseCase.execute.mockRejectedValue(
        new ConflictException('NIA duplicado'),
      );

      // Act & Assert: el controlador debe propagar el mismo tipo de error.
      await expect(
        controller.create({ nia: 'NIA-1', nombre: 'PC' } as CreateActivoDto),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('update', () => {
    it('invoca al caso de uso con el id y el payload y devuelve el id', async () => {
      // Arrange: mock devolviendo un id.
      updateUseCase.execute.mockResolvedValue({ id: 77 });
      const dto: UpdateActivoDto = {
        nombre: 'Nuevo nombre',
        descripcion: 'Actualizado',
        ambiente_id: 4,
      };

      // Act: llamamos al controlador.
      const result = await controller.update(77, dto);

      // Assert: revisamos los argumentos y el resultado.
      expect(updateUseCase.execute).toHaveBeenCalledWith({
        id: 77,
        ...dto,
      });
      expect(result).toEqual({ id: 77 });
    });

    it('propaga ConflictException del caso de uso', async () => {
      // Arrange: el mock rechaza con conflicto.
      updateUseCase.execute.mockRejectedValue(
        new ConflictException('NIA duplicado'),
      );

      // Act & Assert: el controlador debe propagar el error.
      await expect(
        controller.update(10, { nia: 'NIA-1' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('delete', () => {
    it('invoca al caso de uso y devuelve 204', async () => {
      // Arrange: el mock no necesita devolver nada en especial.
      deleteUseCase.execute.mockResolvedValue({ id: 9 });

      // Act: llamamos al controlador con un id.
      await controller.delete(9);

      // Assert: verificamos que se llamo con el id correcto.
      expect(deleteUseCase.execute).toHaveBeenCalledWith({ id: 9 });
    });

    it('propaga NotFoundException cuando el caso de uso falla', async () => {
      // Arrange: simulamos un not found.
      deleteUseCase.execute.mockRejectedValue(
        new NotFoundException('No existe'),
      );

      // Act & Assert: el controlador debe propagar la excepcion.
      await expect(controller.delete(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});

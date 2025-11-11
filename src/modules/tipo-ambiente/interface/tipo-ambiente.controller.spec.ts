// Estas pruebas describen los comportamientos del TipoAmbienteController con comentarios educativos línea a línea.
import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { TipoAmbienteController } from './tipo-ambiente.controller';
import { CreateTipoAmbienteUseCase } from '../application/create-tipo-ambiente.usecase';
import { DeleteTipoAmbienteUseCase } from '../application/delete-tipo-ambiente.usecase';
import { CreateTipoAmbienteDto } from './dto/create-tipo-ambiente.dto';
import { ListTipoAmbientesUseCase } from '../application/list-tipo-ambientes.usecase';
import { ListTipoAmbientesQueryDto } from './dto/list-tipo-ambientes-query.dto';

// Definimos un tipo auxiliar para el caso de uso de creación con un método execute simulado.
type CreateUseCaseMock = {
  execute: jest.Mock<Promise<{ id: number }>, [any]>;
};

type ListUseCaseMock = {
  execute: jest.Mock<Promise<any>, [any]>;
};

type DeleteUseCaseMock = {
  execute: jest.Mock<Promise<void>, [any]>;
};

describe('TipoAmbienteController', () => {
  let controller: TipoAmbienteController;
  let createUseCase: CreateUseCaseMock;
  let listUseCase: ListUseCaseMock;
  let deleteUseCase: DeleteUseCaseMock;

  beforeEach(async () => {
    // Configuramos el mock del caso de uso con Jest para controlar sus respuestas.
    createUseCase = { execute: jest.fn() };
    listUseCase = { execute: jest.fn() };
    deleteUseCase = { execute: jest.fn() };

    // Creamos un módulo de pruebas ligero que inyecta el controlador con el caso de uso simulado.
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TipoAmbienteController],
      providers: [
        { provide: CreateTipoAmbienteUseCase, useValue: createUseCase },
        { provide: ListTipoAmbientesUseCase, useValue: listUseCase },
        { provide: DeleteTipoAmbienteUseCase, useValue: deleteUseCase },
      ],
    }).compile();

    // Obtenemos la instancia real del controlador para cada prueba.
    controller = module.get(TipoAmbienteController);
  });

  describe('create', () => {
    // Caso feliz: el controlador devuelve el id cuando el caso de uso completa la creación.
    it('retorna el id creado cuando el caso de uso finaliza con éxito', async () => {
      createUseCase.execute.mockResolvedValue({ id: 55 });
      const dto: CreateTipoAmbienteDto = {
        nombre: 'Laboratorio de física',
        descripcion: 'Espacio equipado para prácticas científicas',
        descripcion_corta: 'Lab física',
      };

      const result = await controller.create(dto);

      expect(createUseCase.execute).toHaveBeenCalledWith({
        nombre: 'Laboratorio de física',
        descripcion: 'Espacio equipado para prácticas científicas',
        descripcion_corta: 'Lab física',
      });
      expect(result).toEqual({ id: 55 });
    });

    // Validamos que los errores de conflicto se propaguen hacia la capa HTTP.
    it('propaga ConflictException cuando el caso de uso detecta nombre duplicado', async () => {
      createUseCase.execute.mockRejectedValue(
        new ConflictException({
          error: 'CONFLICT_ERROR',
          message: 'Los datos enviados no son validos',
          details: [
            {
              field: 'nombre',
              message: 'Ya existe un tipo de ambiente con ese nombre',
            },
          ],
        }),
      );

      const dto: CreateTipoAmbienteDto = {
        nombre: 'Laboratorio de física',
        descripcion: 'Espacio equipado para prácticas científicas',
      };

      await expect(controller.create(dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    // Validamos que los errores de validación se propaguen correctamente.
    it('propaga BadRequestException cuando el caso de uso detecta datos inválidos', async () => {
      createUseCase.execute.mockRejectedValue(
        new BadRequestException({
          error: 'VALIDATION_ERROR',
          message: 'Los datos enviados no son validos',
          details: [{ field: 'nombre', message: 'El nombre es obligatorio' }],
        }),
      );

      const dto: CreateTipoAmbienteDto = {
        nombre: '',
        descripcion: 'Descripcion inválida',
      };

      await expect(controller.create(dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('retorna la lista con la metadata cuando el use case responde', async () => {
      listUseCase.execute.mockResolvedValue({
        items: [],
        meta: {
          total: 0,
          page: 1,
          take: 8,
          pages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      });

      const query: ListTipoAmbientesQueryDto = {};
      const result = await controller.findAll(query);

      expect(listUseCase.execute).toHaveBeenCalledWith({
        page: 1,
        limit: 8,
        search: null,
        orderBy: 'nombre',
        orderDir: 'asc',
      });
      expect(result.meta.total).toBe(0);
    });

    it('propaga BadRequestException cuando el caso de uso detecta errores', async () => {
      listUseCase.execute.mockRejectedValue(
        new BadRequestException({
          error: 'VALIDATION_ERROR',
          message: 'Los datos enviados no son validos',
          details: [{ field: 'page', message: 'Debe ser mayor o igual a 1' }],
        }),
      );

      await expect(controller.findAll({ page: 0 })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('remove', () => {
    it('invoca al caso de uso y devuelve 204', async () => {
      deleteUseCase.execute.mockResolvedValue({ id: 3 });

      await controller.remove(3);

      expect(deleteUseCase.execute).toHaveBeenCalledWith({ id: 3 });
    });

    it('propaga NotFoundException cuando el tipo de ambiente no existe', async () => {
      deleteUseCase.execute.mockRejectedValue(
        new NotFoundException('No se encontró el tipo de ambiente'),
      );

      await expect(controller.remove(99)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});

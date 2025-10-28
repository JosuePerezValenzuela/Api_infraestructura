import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { TipoBloqueController } from './tipo-bloque.controller';
import { CreateTipoBloqueUseCase } from '../application/create-tipo-bloque.usecase';
import { ListTipoBloquesUseCase } from '../application/list-tipo-bloques.usecase';
import { UpdateTipoBloqueUseCase } from '../application/update-tipo-bloque.usecase';
import { UpdateTipoBloqueDto } from './dto/update-tipo-bloque.dto';
import { CreateTipoBloqueDto } from './dto/create-tipo-bloque.dto';
import { ListTipoBloquesQueryDto } from './dto/list-tipo-bloques-query.dto';

type CreateUseCaseMock = {
  execute: jest.Mock<Promise<{ id: number }>, [any]>;
};

type ListUseCaseMock = {
  execute: jest.Mock<Promise<any>, [any]>;
};

type UpdateUseCaseMock = {
  execute: jest.Mock<Promise<{ id: number }>, [any]>;
};

describe('TipoBloqueController', () => {
  let controller: TipoBloqueController;
  let createUseCase: CreateUseCaseMock;
  let listUseCase: ListUseCaseMock;
  let updateUseCase: UpdateUseCaseMock;

  beforeEach(async () => {
    createUseCase = { execute: jest.fn() };
    listUseCase = { execute: jest.fn() };
    updateUseCase = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TipoBloqueController],
      providers: [
        { provide: CreateTipoBloqueUseCase, useValue: createUseCase },
        { provide: ListTipoBloquesUseCase, useValue: listUseCase },
        { provide: UpdateTipoBloqueUseCase, useValue: updateUseCase },
      ],
    }).compile();

    controller = module.get<TipoBloqueController>(TipoBloqueController);
  });

  describe('create', () => {
    it('retorna 201 con el identificador cuando la creacion es exitosa', async () => {
      createUseCase.execute.mockResolvedValue({ id: 42 });
      const dto: CreateTipoBloqueDto = {
        nombre: 'Edificio de aulas',
        descripcion: 'Espacios destinados a clases',
      };

      const result = await controller.create(dto);

      expect(createUseCase.execute).toHaveBeenCalledWith({
        nombre: 'Edificio de aulas',
        descripcion: 'Espacios destinados a clases',
      });
      expect(result).toEqual({ id: 42 });
    });

    it('propaga ConflictException cuando el nombre esta duplicado', async () => {
      createUseCase.execute.mockRejectedValue(
        new ConflictException('Ya existe un tipo de bloque con ese nombre'),
      );
      const dto: CreateTipoBloqueDto = {
        nombre: 'Laboratorios',
        descripcion: 'Salas especializadas',
      };

      await expect(controller.create(dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('propaga BadRequestException cuando los datos son invalidos', async () => {
      createUseCase.execute.mockRejectedValue(
        new BadRequestException({
          error: 'VALIDATION_ERROR',
          message: 'Los datos enviados no son validos',
          details: [{ field: 'nombre', message: 'El nombre es obligatorio' }],
        }),
      );
      const dto: CreateTipoBloqueDto = {
        nombre: '',
        descripcion: 'Descripcion invalida',
      };

      await expect(controller.create(dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('devuelve los tipos de bloque junto con la metadata', async () => {
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

      const query: ListTipoBloquesQueryDto = {};
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
          details: [{ field: 'page', message: 'Debe ser >= 1' }],
        }),
      );

      await expect(controller.findAll({ page: 0 })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('update', () => {
    it('actualiza un tipo de bloque y devuelve el id', async () => {
      updateUseCase.execute.mockResolvedValue({ id: 10 });
      const dto: UpdateTipoBloqueDto = {
        nombre: 'Bloque renovado',
        descripcion: 'Instalaciones mixtas',
      };

      const result = await controller.update(10, dto);

      expect(updateUseCase.execute).toHaveBeenCalledWith({
        id: 10,
        nombre: 'Bloque renovado',
        descripcion: 'Instalaciones mixtas',
      });
      expect(result).toEqual({ id: 10 });
    });

    it('propaga NotFoundException cuando el recurso no existe', async () => {
      updateUseCase.execute.mockRejectedValue(
        new NotFoundException('No se encontro el tipo de bloque'),
      );
      const dto: UpdateTipoBloqueDto = {
        descripcion: 'Descripcion actualizada',
      };

      await expect(controller.update(99, dto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('propaga ConflictException cuando el nombre ya existe', async () => {
      updateUseCase.execute.mockRejectedValue(
        new ConflictException('Nombre duplicado'),
      );
      const dto: UpdateTipoBloqueDto = {
        nombre: 'Duplicado',
      };

      await expect(controller.update(5, dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('propaga BadRequestException cuando los datos son invalidos', async () => {
      updateUseCase.execute.mockRejectedValue(
        new BadRequestException({
          error: 'VALIDATION_ERROR',
          message: 'Los datos enviados no son validos',
          details: [
            { field: 'descripcion', message: 'La descripcion es obligatoria' },
          ],
        }),
      );
      const dto: UpdateTipoBloqueDto = {};

      await expect(
        controller.update(5, dto as UpdateTipoBloqueDto),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});

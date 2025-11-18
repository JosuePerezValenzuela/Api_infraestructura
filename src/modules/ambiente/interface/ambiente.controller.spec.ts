// En este archivo documentamos el comportamiento del controlador de ambientes paso a paso para que cualquiera aprenda qué espera nuestra API.

import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { AmbienteController } from './ambiente.controller';
import { CreateAmbienteUseCase } from '../application/create-ambiente.usecase';
import { ListAmbientesUseCase } from '../application/list-ambientes.usecase';
import { DeleteAmbienteUseCase } from '../application/delete-ambiente.usecase';
import { CreateAmbienteDto } from './dto/create-ambiente.dto';
import { ListAmbientesQueryDto } from './dto/list-ambientes-query.dto';
import { ListAmbientesResult } from '../domain/ambiente.list.types';

type CreateUseCaseMock = {
  execute: jest.Mock<Promise<{ id: number }>, [any]>;
};
type ListUseCaseMock = {
  execute: jest.Mock<Promise<ListAmbientesResult>, [any]>;
};
type DeleteUseCaseMock = {
  execute: jest.Mock<Promise<void>, [any]>;
};

describe('AmbienteController', () => {
  let controller: AmbienteController;
  let createUseCase: CreateUseCaseMock;
  let listUseCase: ListUseCaseMock;
  let deleteUseCase: DeleteUseCaseMock;

  beforeEach(async () => {
    createUseCase = { execute: jest.fn() };
    listUseCase = { execute: jest.fn() };
    deleteUseCase = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AmbienteController],
      providers: [
        { provide: CreateAmbienteUseCase, useValue: createUseCase },
        { provide: ListAmbientesUseCase, useValue: listUseCase },
        { provide: DeleteAmbienteUseCase, useValue: deleteUseCase },
      ],
    }).compile();

    controller = module.get<AmbienteController>(AmbienteController);
  });

  describe('findAll', () => {
    it('normaliza filtros por defecto y llama al caso de uso', async () => {
      const emptyResult: ListAmbientesResult = {
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

      const result = await controller.findAll({} as ListAmbientesQueryDto);

      expect(listUseCase.execute).toHaveBeenCalledWith({
        page: undefined,
        limit: undefined,
        search: undefined,
        orderBy: undefined,
        orderDir: undefined,
        bloqueId: undefined,
        facultadId: undefined,
        tipoAmbienteId: undefined,
        activo: undefined,
        clases: undefined,
        pisoMin: undefined,
        pisoMax: undefined,
      });
      expect(result).toEqual(emptyResult);
    });

    it('propaga BadRequestException cuando el caso de uso lo indica', async () => {
      listUseCase.execute.mockRejectedValue(
        new BadRequestException({
          error: 'VALIDATION_ERROR',
          message: 'Los datos enviados no son validos',
          details: [{ field: 'page', message: 'Debe ser >= 1' }],
        }),
      );

      await expect(
        controller.findAll({ page: 0 } as ListAmbientesQueryDto),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('delete', () => {
    it('invoca al caso de uso y retorna 204', async () => {
      await controller.delete(5);
      expect(deleteUseCase.execute).toHaveBeenCalledWith({ id: 5 });
    });

    it('propaga NotFoundException cuando el caso de uso falla', async () => {
      deleteUseCase.execute.mockRejectedValue(
        new NotFoundException('No existe'),
      );
      await expect(controller.delete(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('devuelve el id cuando la creación es exitosa', async () => {
      createUseCase.execute.mockResolvedValue({ id: 120 });
      const dto: CreateAmbienteDto = {
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
        tipo_ambiente_id: 5,
        bloque_id: 8,
      };

      const result = await controller.create(dto);

      expect(createUseCase.execute).toHaveBeenCalledWith({
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
        tipo_ambiente_id: 5,
        bloque_id: 8,
        activo: undefined,
      });
      expect(result).toEqual({ id: 120 });
    });

    it('propaga BadRequestException cuando el caso de uso lo indica', async () => {
      createUseCase.execute.mockRejectedValue(
        new BadRequestException({
          error: 'VALIDATION_ERROR',
          message: 'Los datos enviados no son validos',
          details: [{ field: 'bloque_id', message: 'Bloque inexistente' }],
        }),
      );
      const dto: CreateAmbienteDto = {
        nombre: 'Laboratorio',
        codigo: 'LAB01',
        piso: 1,
        clases: true,
        tipo_ambiente_id: 99,
        bloque_id: 88,
      };

      await expect(controller.create(dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('propaga ConflictException cuando el caso de uso detecta código duplicado', async () => {
      createUseCase.execute.mockRejectedValue(
        new ConflictException('Ya existe un ambiente con ese codigo'),
      );
      const dto: CreateAmbienteDto = {
        nombre: 'Laboratorio',
        codigo: 'LAB01',
        piso: 1,
        clases: true,
        tipo_ambiente_id: 99,
        bloque_id: 88,
      };

      await expect(controller.create(dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });
});

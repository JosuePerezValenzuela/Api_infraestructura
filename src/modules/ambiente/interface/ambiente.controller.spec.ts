// En este archivo documentamos el comportamiento del controlador de ambientes paso a paso para que cualquiera aprenda qué espera nuestra API.

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { AmbienteController } from './ambiente.controller';
import { CreateAmbienteUseCase } from '../application/create-ambiente.usecase';
import { CreateAmbienteDto } from './dto/create-ambiente.dto';

type CreateUseCaseMock = {
  execute: jest.Mock<Promise<{ id: number }>, [any]>;
};

describe('AmbienteController', () => {
  let controller: AmbienteController;
  let createUseCase: CreateUseCaseMock;

  beforeEach(async () => {
    createUseCase = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AmbienteController],
      providers: [{ provide: CreateAmbienteUseCase, useValue: createUseCase }],
    }).compile();

    controller = module.get<AmbienteController>(AmbienteController);
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

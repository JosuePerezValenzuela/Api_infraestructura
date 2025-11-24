// En este archivo explicamos el comportamiento esperado de ActivoController.
// Cada prueba describe la historia completa para que alguien sin experiencia entienda la API.

import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ActivoController } from './activo.controller';
import { ListActivosUseCase } from '../application/list-activos.usecase';
import { ListActivosQueryDto } from './dto/list-activos-query.dto';
import { ListActivosResult } from '../domain/activo.list.types';

// Definimos el tipo del mock para el caso de uso de listado.
type ListUseCaseMock = {
  execute: jest.Mock<Promise<ListActivosResult>, [any]>;
};

describe('ActivoController', () => {
  let controller: ActivoController;
  let listUseCase: ListUseCaseMock;

  // Antes de cada prueba armamos el modulo de testing con el controlador real y el caso de uso simulado.
  beforeEach(async () => {
    listUseCase = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActivoController],
      providers: [{ provide: ListActivosUseCase, useValue: listUseCase }],
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
});

// Este archivo define las pruebas del controlador de facultad para el endpoint DELETE.
import {
  HttpException,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { FacultadController } from './facultad.controller';
import type {
  ListFacultadesItem,
  ListFacultadesMeta,
  ListFacultadesResult,
} from '../domain/facultad.list.types';
import { ListFacultadesQueryDto } from './dto/list-facultades-query.dto';

interface FakeListFacultadesUseCase {
  execute: jest.Mock<
    Promise<ListFacultadesResult>,
    [Partial<ListFacultadesQueryDto>]
  >;
}

interface FakeDeleteFacultadUseCase {
  execute: jest.Mock<
    Promise<{ id: number; deletedFacultad?: boolean }>,
    [{ id: number; campusId: number }]
  >;
}

describe('FacultadController - findPaginated', () => {
  const buildController = () => {
    const createFacultadUseCase = { execute: jest.fn() };
    const listFacultadesUseCase: FakeListFacultadesUseCase = {
      execute: jest.fn(),
    };
    const updateFacultadUseCase = { execute: jest.fn() };
    const deleteFacultadUseCase: FakeDeleteFacultadUseCase = {
      execute: jest.fn(),
    };
    const controller = new FacultadController(
      createFacultadUseCase as any,
      listFacultadesUseCase as any,
      updateFacultadUseCase as any,
      deleteFacultadUseCase as any,
    );
    return {
      controller,
      createFacultadUseCase,
      listFacultadesUseCase,
      updateFacultadUseCase,
      deleteFacultadUseCase,
    };
  };

  it('retorna las facultades paginadas y transmite correctamente los filtros al caso de uso', async () => {
    const { controller, listFacultadesUseCase } = buildController();
    const responseItems: ListFacultadesItem[] = [
      {
        id: 7,
        codigo: 'FCYT-01',
        nombre: 'Facultad de Ciencias y Tecnologia',
        nombre_corto: 'FCyT',
        campus_nombre: 'Campus Central',
        activo: true,
        lat: -16,
        lng: -16,
        campus_id: 1,
        creado_en: '2025-10-10T15:30:00.000Z',
      },
    ];
    const responseMeta: ListFacultadesMeta = {
      total: 12,
      page: 2,
      take: 5,
      hasNextPage: true,
      hasPreviousPage: true,
    };
    const expectedResponse: ListFacultadesResult = {
      items: responseItems,
      meta: responseMeta,
    };
    listFacultadesUseCase.execute.mockResolvedValue(expectedResponse);
    const queryDto = Object.assign(new ListFacultadesQueryDto(), {
      page: 2,
      limit: 5,
      search: 'tecnologia',
      orderBy: 'codigo' as const,
      orderDir: 'desc' as const,
    });
    const result = await controller.findPaginated(queryDto);
    expect(listFacultadesUseCase.execute).toHaveBeenCalledWith({
      page: 2,
      take: 5,
      search: 'tecnologia',
      orderBy: 'codigo',
      orderDir: 'desc',
    });
    expect(result).toEqual(expectedResponse);
  });

  it('aplica valores opcionales en null cuando no se proporcionan y mantiene los defaults del DTO', async () => {
    const { controller, listFacultadesUseCase } = buildController();
    const emptyResponse: ListFacultadesResult = {
      items: [],
      meta: {
        total: 0,
        page: 1,
        take: 8,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
    listFacultadesUseCase.execute.mockResolvedValue(emptyResponse);
    const queryDto = new ListFacultadesQueryDto();
    await controller.findPaginated(queryDto);
    const [[params]] = listFacultadesUseCase.execute.mock.calls;
    expect(params.search).toBeNull();
    expect(params.take).toBe(8);
    expect(params.page).toBe(1);
  });
});

describe('FacultadController - delete', () => {
  const buildController = () => {
    const createFacultadUseCase = { execute: jest.fn() };
    const listFacultadesUseCase = { execute: jest.fn() };
    const updateFacultadUseCase = { execute: jest.fn() };
    const deleteFacultadUseCase: FakeDeleteFacultadUseCase = {
      execute: jest.fn(),
    };
    const controller = new FacultadController(
      createFacultadUseCase as any,
      listFacultadesUseCase as any,
      updateFacultadUseCase as any,
      deleteFacultadUseCase as any,
    );
    return {
      controller,
      deleteFacultadUseCase,
    };
  };

  // Flujo feliz: elimina relación exitosamente
  it('invoca el caso de uso de eliminacion y retorna void en el flujo feliz', async () => {
    const { controller, deleteFacultadUseCase } = buildController();
    deleteFacultadUseCase.execute.mockResolvedValue({ id: 1 });
    const response = await controller.delete(1, 3);
    expect(deleteFacultadUseCase.execute).toHaveBeenCalledWith({
      id: 1,
      campusId: 3,
    });
    expect(response).toBeUndefined();
  });

  // Lanza HttpException 404 cuando la facultad no existe
  it('lanza HttpException 404 cuando el caso de uso lanza NotFoundException', async () => {
    const { controller, deleteFacultadUseCase } = buildController();
    const notFoundException = new NotFoundException({
      error: 'NOT_FOUND',
      message: 'No se encontro la facultad',
      details: [{ field: 'id', message: 'Facultad inexistente' }],
    });
    deleteFacultadUseCase.execute.mockRejectedValue(notFoundException);
    await expect(controller.delete(99, 3)).rejects.toThrow(HttpException);
    try {
      await controller.delete(99, 3);
    } catch (err) {
      expect(err).toBeInstanceOf(HttpException);
      expect((err as HttpException).getStatus()).toBe(404);
    }
  });

  // Lanza HttpException 409 cuando hay bloques dependientes
  it('lanza HttpException 409 cuando el caso de uso lanza ConflictException', async () => {
    const { controller, deleteFacultadUseCase } = buildController();
    const conflictException = new ConflictException({
      error: 'CONFLICT_ERROR',
      message:
        'No se puede eliminar la relacion porque hay bloques dependientes',
      details: [],
    });
    deleteFacultadUseCase.execute.mockRejectedValue(conflictException);
    try {
      await controller.delete(1, 3);
    } catch (err) {
      expect(err).toBeInstanceOf(HttpException);
      expect((err as HttpException).getStatus()).toBe(409);
    }
  });

  // Lanza HttpException 400 cuando la relación no existe
  it('lanza HttpException 400 cuando el caso de uso lanza BadRequestException', async () => {
    const { controller, deleteFacultadUseCase } = buildController();
    const badRequestException = new BadRequestException({
      error: 'VALIDATION_ERROR',
      message: 'No existe relacion entre la facultad y el campus',
      details: [],
    });
    deleteFacultadUseCase.execute.mockRejectedValue(badRequestException);
    try {
      await controller.delete(1, 3);
    } catch (err) {
      expect(err).toBeInstanceOf(HttpException);
      expect((err as HttpException).getStatus()).toBe(400);
    }
  });

  // Propaga error interno
  it('lanza HttpException 500 cuando hay un error desconocido', async () => {
    const { controller, deleteFacultadUseCase } = buildController();
    deleteFacultadUseCase.execute.mockRejectedValue(new Error('Unknown error'));
    try {
      await controller.delete(1, 3);
    } catch (err) {
      expect(err).toBeInstanceOf(HttpException);
      expect((err as HttpException).getStatus()).toBe(500);
    }
  });
});

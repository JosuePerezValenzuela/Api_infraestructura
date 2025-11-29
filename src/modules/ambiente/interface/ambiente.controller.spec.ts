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
import { ListAmbientesDisponiblesUseCase } from '../application/list-ambientes-disponibles.usecase';
import { DeleteAmbienteUseCase } from '../application/delete-ambiente.usecase';
import { UpdateAmbienteUseCase } from '../application/update-ambiente.usecase';
import { ReplaceHorariosUseCase } from '../application/replace-horarios.usecase';
import { ListAmbienteHorariosUseCase } from '../application/list-ambiente-horarios.usecase';
import { CreateAmbienteDto } from './dto/create-ambiente.dto';
import { ListAmbientesQueryDto } from './dto/list-ambientes-query.dto';
import { ListAmbientesDisponiblesQueryDto } from './dto/list-ambientes-disponibles-query.dto';
import { UpdateAmbienteDto } from './dto/update-ambiente.dto';
import { ReplaceHorariosDto } from './dto/replace-horarios.dto';
import { ListAmbientesResult } from '../domain/ambiente.list.types';
import { ListAmbientesDisponiblesResult } from '../domain/ambiente.disponibles.types';

type CreateUseCaseMock = {
  execute: jest.Mock<Promise<{ id: number }>, [any]>;
};
type ListUseCaseMock = {
  execute: jest.Mock<Promise<ListAmbientesResult>, [any]>;
};
type ListDisponiblesUseCaseMock = {
  execute: jest.Mock<Promise<ListAmbientesDisponiblesResult>, [any]>;
};
type DeleteUseCaseMock = {
  execute: jest.Mock<Promise<void>, [any]>;
};
type UpdateUseCaseMock = {
  execute: jest.Mock<Promise<{ id: number }>, [any]>;
};
type ReplaceUseCaseMock = {
  execute: jest.Mock<Promise<{ ambiente_id: number; total: number }>, [any]>;
};
type ListHorariosUseCaseMock = {
  execute: jest.Mock<Promise<any>, [any]>;
};

describe('AmbienteController', () => {
  let controller: AmbienteController;
  let createUseCase: CreateUseCaseMock;
  let listUseCase: ListUseCaseMock;
  let listDisponiblesUseCase: ListDisponiblesUseCaseMock;
  let deleteUseCase: DeleteUseCaseMock;
  let updateUseCase: UpdateUseCaseMock;
  let replaceUseCase: ReplaceUseCaseMock;
  let listHorariosUseCase: ListHorariosUseCaseMock;

  beforeEach(async () => {
    createUseCase = { execute: jest.fn() };
    listUseCase = { execute: jest.fn() };
    listDisponiblesUseCase = { execute: jest.fn() };
    deleteUseCase = { execute: jest.fn() };
    updateUseCase = { execute: jest.fn() };
    replaceUseCase = { execute: jest.fn() };
    listHorariosUseCase = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AmbienteController],
      providers: [
        { provide: CreateAmbienteUseCase, useValue: createUseCase },
        { provide: ListAmbientesUseCase, useValue: listUseCase },
        {
          provide: ListAmbientesDisponiblesUseCase,
          useValue: listDisponiblesUseCase,
        },
        { provide: ListAmbienteHorariosUseCase, useValue: listHorariosUseCase },
        { provide: DeleteAmbienteUseCase, useValue: deleteUseCase },
        { provide: UpdateAmbienteUseCase, useValue: updateUseCase },
        { provide: ReplaceHorariosUseCase, useValue: replaceUseCase },
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

  describe('findDisponibles', () => {
    it('normaliza filtros y llama al caso de uso de disponibles', async () => {
      // Preparamos un resultado vacio para simular la respuesta del caso de uso.
      const emptyResult: ListAmbientesDisponiblesResult = {
        items: [],
        meta: {
          total: 0,
          page: 1,
          take: 10,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
      // Indicamos al mock que resuelva con ese resultado.
      listDisponiblesUseCase.execute.mockResolvedValue(emptyResult);

      // Construimos un query con todos los filtros validos para probar la delegacion.
      const query: ListAmbientesDisponiblesQueryDto = {
        capacidad_min: 10,
        capacidad_examen_min: 20,
        mismo_piso: true,
        tipo_ambiente_ids: [1, 2],
        campus_ids: [1],
        facultad_ids: [1],
        bloque_ids: [1],
        tipo_bloque_ids: [3],
        dia: 1,
        hora_inicio: '08:00',
        hora_fin: '10:00',
        page: 2,
        take: 5,
        orderBy: 'codigo',
        orderDir: 'desc',
      };

      // Ejecutamos el controlador con el query y guardamos la respuesta.
      const result = await controller.findDisponibles(query);

      // Verificamos que haya delegado al caso de uso con el mismo payload recibido.
      expect(listDisponiblesUseCase.execute).toHaveBeenCalledWith(query);
      // Confirmamos que la respuesta sea la misma que retorna el caso de uso.
      expect(result).toEqual(emptyResult);
    });

    it('propaga BadRequestException cuando el caso de uso lo indica', async () => {
      // Configuramos el mock para rechazar con una BadRequestException.
      listDisponiblesUseCase.execute.mockRejectedValue(
        new BadRequestException('Datos invalidos'),
      );

      // Esperamos que el controlador propague la misma excepcion al llamarlo.
      await expect(
        controller.findDisponibles({ capacidad_min: -1 } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('listHorarios', () => {
    it('retorna metadatos y franjas del ambiente', async () => {
      const dtoResult = {
        items: [{ dia: 0, hora_inicio: '08:00', hora_fin: '10:00' }],
        hora_apertura: '07:00',
        hora_cierre: '21:00',
        periodo: 90,
      };
      listHorariosUseCase.execute.mockResolvedValue(dtoResult);

      const result = await controller.listHorarios(5);

      expect(listHorariosUseCase.execute).toHaveBeenCalledWith({
        ambiente_id: 5,
      });
      expect(result).toEqual(dtoResult);
    });

    it('propaga NotFoundException cuando el caso de uso lo indica', async () => {
      listHorariosUseCase.execute.mockRejectedValue(new NotFoundException());
      await expect(controller.listHorarios(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
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

  describe('update', () => {
    it('llama al caso de uso con el payload y devuelve el id', async () => {
      updateUseCase.execute.mockResolvedValue({ id: 15 });
      const dto: UpdateAmbienteDto = { nombre: 'Aula renovada' };

      const result = await controller.update(15, dto);

      expect(updateUseCase.execute).toHaveBeenCalledWith({
        id: 15,
        input: dto,
      });
      expect(result).toEqual({ id: 15 });
    });

    it('propaga errores del caso de uso', async () => {
      updateUseCase.execute.mockRejectedValue(
        new ConflictException('codigo duplicado'),
      );
      await expect(
        controller.update(20, { codigo: 'LAB-01' }),
      ).rejects.toBeInstanceOf(ConflictException);
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
  describe('replaceHorariosHandler', () => {
    it('llama al caso de uso para reemplazar franjas', async () => {
      replaceUseCase.execute.mockResolvedValue({ ambiente_id: 9, total: 2 });
      const dto: ReplaceHorariosDto = {
        hora_apertura: '07:00',
        hora_cierre: '21:00',
        periodo: 90,
        franjas: [
          { dia: 0, hora_inicio: '08:00', hora_fin: '10:00' },
          { dia: 1, hora_inicio: '11:00', hora_fin: '12:00' },
        ],
      };

      const result = await controller.replaceHorariosHandler(9, dto);

      expect(replaceUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          ambiente_id: 9,
          hora_apertura: '07:00',
          hora_cierre: '21:00',
          periodo: 90,
          franjas: [
            { dia: 0, hora_inicio: '08:00', hora_fin: '10:00' },
            { dia: 1, hora_inicio: '11:00', hora_fin: '12:00' },
          ],
        }),
      );
      expect(result).toEqual({ ambiente_id: 9, total: 2 });
    });

    it('propaga excepciones lanzadas por el caso de uso', async () => {
      replaceUseCase.execute.mockRejectedValue(
        new ConflictException('solapamiento'),
      );
      const dto: ReplaceHorariosDto = {
        franjas: [{ dia: 0, hora_inicio: '08:00', hora_fin: '09:00' }],
      };

      await expect(
        controller.replaceHorariosHandler(1, dto),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });
});

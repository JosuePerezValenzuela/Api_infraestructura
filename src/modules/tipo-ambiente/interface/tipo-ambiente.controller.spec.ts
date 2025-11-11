// Estas pruebas describen los comportamientos del TipoAmbienteController con comentarios educativos línea a línea.
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { TipoAmbienteController } from './tipo-ambiente.controller';
import { CreateTipoAmbienteUseCase } from '../application/create-tipo-ambiente.usecase';
import { CreateTipoAmbienteDto } from './dto/create-tipo-ambiente.dto';

// Definimos un tipo auxiliar para el caso de uso de creación con un método execute simulado.
type CreateUseCaseMock = {
  execute: jest.Mock<Promise<{ id: number }>, [any]>;
};

describe('TipoAmbienteController', () => {
  let controller: TipoAmbienteController;
  let createUseCase: CreateUseCaseMock;

  beforeEach(async () => {
    // Configuramos el mock del caso de uso con Jest para controlar sus respuestas.
    createUseCase = { execute: jest.fn() };

    // Creamos un módulo de pruebas ligero que inyecta el controlador con el caso de uso simulado.
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TipoAmbienteController],
      providers: [
        { provide: CreateTipoAmbienteUseCase, useValue: createUseCase },
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
});

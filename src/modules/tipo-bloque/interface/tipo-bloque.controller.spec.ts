// Este archivo contiene las pruebas del TipoBloqueController y explica cada paso para quien aprende NestJS.
// Importamos los helpers de testing de Nest para montar un modulo ligero con el controlador.
import { Test, TestingModule } from '@nestjs/testing';
// Importamos ConflictException y BadRequestException para simular los errores que puede lanzar el caso de uso.
import { ConflictException, BadRequestException } from '@nestjs/common';
// Importamos el controlador que vamos a probar (todavia no implementado) para definir su comportamiento esperado.
import { TipoBloqueController } from './tipo-bloque.controller';
// Importamos el caso de uso para poder mockearlo y observar como interactua el controlador.
import { CreateTipoBloqueUseCase } from '../application/create-tipo-bloque.usecase';
// Importamos el DTO para crear instancias consistentes con el contrato del controlador.
import { CreateTipoBloqueDto } from './dto/create-tipo-bloque.dto';

// Definimos un tipo que describe el mock del caso de uso, para mantener autocompletado y seguridad de tipos.
type CreateTipoBloqueUseCaseMock = {
  execute: jest.Mock<Promise<{ id: number }>, [any]>;
};

describe('TipoBloqueController', () => {
  let controller: TipoBloqueController;
  let useCase: CreateTipoBloqueUseCaseMock;

  // Antes de cada prueba configuramos un modulo de testing de Nest con el controlador y el mock del caso de uso.
  beforeEach(async () => {
    // Creamos el mock del caso de uso con jest.fn para observar las llamadas.
    useCase = {
      execute: jest.fn(),
    };

    // Configuramos el modulo de pruebas con el controlador real y el provider falso para el caso de uso.
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TipoBloqueController],
      providers: [
        {
          provide: CreateTipoBloqueUseCase,
          useValue: useCase,
        },
      ],
    }).compile();

    // Obtenemos una instancia real del controlador desde el modulo compilado.
    controller = module.get<TipoBloqueController>(TipoBloqueController);
  });

  // Este caso cubre el camino feliz donde el tipo de bloque se crea correctamente.
  it('retorna 201 con el identificador cuando la creacion es exitosa', async () => {
    // Simulamos que el caso de uso devuelve un id determinado.
    useCase.execute.mockResolvedValue({ id: 42 });
    // Construimos el DTO con datos validos que representen la peticion del usuario.
    const dto: CreateTipoBloqueDto = {
      nombre: 'Edificio de aulas',
      descripcion: 'Espacios destinados a clases',
    };
    // Ejecutamos el metodo create del controlador.
    const result = await controller.create(dto);
    // Verificamos que el caso de uso haya recibido los datos esperados.
    expect(useCase.execute).toHaveBeenCalledWith({
      nombre: 'Edificio de aulas',
      descripcion: 'Espacios destinados a clases',
    });
    // Confirmamos que el controlador responda con el objeto { id } devuelto por el caso de uso.
    expect(result).toEqual({ id: 42 });
  });

  // Este caso asegura que propagamos correctamente los errores de conflicto.
  it('propaga ConflictException cuando el nombre esta duplicado', async () => {
    // Configuramos el mock para que el caso de uso rechace con ConflictException.
    useCase.execute.mockRejectedValue(
      new ConflictException('Ya existe un tipo de bloque con ese nombre'),
    );
    const dto: CreateTipoBloqueDto = {
      nombre: 'Laboratorios',
      descripcion: 'Salas especializadas',
    };
    // Ejecutamos el controlador y esperamos que se rechace con la misma excepcion.
    await expect(controller.create(dto)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  // Este caso cubre la propagacion de errores de validacion que vienen del caso de uso.
  it('propaga BadRequestException cuando los datos son invalidos', async () => {
    // Simulamos que el caso de uso detecta un error de validacion y lanza BadRequestException.
    useCase.execute.mockRejectedValue(
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
    // Esperamos que el controlador simplemente propague la excepcion sin alterar el payload.
    await expect(controller.create(dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});

// En este archivo definimos las pruebas del caso de uso CreateTipoBloqueUseCase explicando cada linea para alguien sin experiencia previa.
// Importamos las excepciones ConflictException y BadRequestException para validar los errores que debe producir el caso de uso.
import { ConflictException, BadRequestException } from '@nestjs/common';
// Importamos la clase CreateTipoBloqueUseCase (aun por implementar) para describir el comportamiento esperado.
import { CreateTipoBloqueUseCase } from './create-tipo-bloque.usecase';

// Definimos una interfaz local que describe las funciones que esperamos del repositorio de tipos de bloque.
interface FakeTipoBloqueRepositoryPort {
  // Declaramos el metodo create como una funcion simulada de Jest que retorna una promesa con el id creado.
  create: jest.Mock<
    Promise<{ id: number }>,
    [
      {
        nombre: string;
        descripcion: string;
        activo: boolean;
      },
    ]
  >;
  // Declaramos el metodo isNameTaken para detectar nombres duplicados antes de crear.
  isNameTaken: jest.Mock<Promise<boolean>, [string]>;
}

// Encerramos las pruebas dentro de describe para agrupar todo el comportamiento del caso de uso.
describe('CreateTipoBloqueUseCase', () => {
  // Definimos una funcion auxiliar que construye el sistema bajo prueba con configuraciones especificas.
  const buildSystem = (options?: { nameTaken?: boolean }) => {
    // Obtenemos el indicador de nombre duplicado de las opciones, por defecto es false.
    const nameTaken = options?.nameTaken ?? false;
    // Creamos un repositorio falso con los metodos create e isNameTaken controlados por Jest.
    const repo: FakeTipoBloqueRepositoryPort = {
      create: jest.fn().mockResolvedValue({ id: 10 }),
      isNameTaken: jest.fn().mockResolvedValue(nameTaken),
    };
    // Instanciamos el caso de uso pasando el repositorio falso como dependencia.
    const useCase = new CreateTipoBloqueUseCase(repo as unknown as any);
    // Retornamos las dependencias para que cada prueba pueda inspeccionarlas.
    return { useCase, repo };
  };

  // Probamos el camino feliz donde se crea el tipo de bloque con datos validos.
  it('crea un tipo de bloque cuando los datos son validos', async () => {
    // Construimos el sistema con el nombre disponible.
    const { useCase, repo } = buildSystem();
    // Definimos el comando simulando la peticion del usuario con espacios extra.
    const command = {
      nombre: '  Edificio Aulas  ',
      descripcion: '  Espacios destinados a clases  ',
    };
    // Ejecutamos el caso de uso con el comando.
    const result = await useCase.execute(command);
    // Verificamos que se consulto la existencia del nombre usando la version recortada.
    expect(repo.isNameTaken).toHaveBeenCalledWith('Edificio Aulas');
    // Confirmamos que se invoco al metodo create con los datos limpios y activo=true por defecto.
    expect(repo.create).toHaveBeenCalledWith({
      nombre: 'Edificio Aulas',
      descripcion: 'Espacios destinados a clases',
      activo: true,
    });
    // Validamos que el caso de uso devuelva el identificador proporcionado por el repositorio.
    expect(result).toEqual({ id: 10 });
  });

  // Probamos que se retorne ConflictException cuando el nombre ya existe.
  it('lanza ConflictException si el nombre ya existe', async () => {
    // Construimos el sistema indicando que el nombre esta ocupado.
    const { useCase, repo } = buildSystem({ nameTaken: true });
    // Definimos el comando con datos validos.
    const command = {
      nombre: 'Laboratorios',
      descripcion: 'Salas especializadas con equipamiento',
    };
    // Ejecutamos el caso de uso esperando que rechace con ConflictException.
    await expect(useCase.execute(command)).rejects.toBeInstanceOf(
      ConflictException,
    );
    // Verificamos que no se haya intentado crear el registro despues de detectar el duplicado.
    expect(repo.create).not.toHaveBeenCalled();
  });

  // Probamos la validacion que evita nombres vacios o excesivamente largos.
  it('lanza BadRequestException si el nombre es invalido', async () => {
    // Construimos el sistema con el nombre disponible.
    const { useCase, repo } = buildSystem();
    // Definimos un comando con nombre vacio y descripcion valida.
    const command = {
      nombre: '  ',
      descripcion: 'Descripcion valida',
    };
    // Ejecutamos el caso de uso esperando BadRequestException.
    await expect(useCase.execute(command)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    // Confirmamos que no se consulto el repositorio porque fallamos antes.
    expect(repo.isNameTaken).not.toHaveBeenCalled();
    // Confirmamos que no se intento crear el registro.
    expect(repo.create).not.toHaveBeenCalled();
  });

  // Probamos que la descripcion tenga longitud adecuada para proteger la base de datos.
  it('lanza BadRequestException si la descripcion supera el limite permitido', async () => {
    // Construimos el sistema con el nombre disponible.
    const { useCase, repo } = buildSystem();
    // Generamos una descripcion larga de 300 caracteres superando el maximo de 256.
    const longDescription = 'x'.repeat(300);
    // Definimos el comando con nombre valido y descripcion demasiado larga.
    const command = {
      nombre: 'Centro Medico',
      descripcion: longDescription,
    };
    // Ejecutamos el caso de uso esperando el error de validacion.
    await expect(useCase.execute(command)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    // Verificamos que no se haya llamado al repositorio en ninguna forma.
    expect(repo.isNameTaken).not.toHaveBeenCalled();
    expect(repo.create).not.toHaveBeenCalled();
  });

  // Probamos que si el usuario envia el campo activo se respete su valor.
  it('respeta el valor de activo cuando viene en el comando', async () => {
    // Construimos el sistema con el nombre disponible.
    const { useCase, repo } = buildSystem();
    // Definimos el comando fijando activo en false para simular un registro deshabilitado.
    const command = {
      nombre: 'Depositos',
      descripcion: 'Almacenes de materiales',
      activo: false,
    };
    // Ejecutamos el caso de uso con el comando personalizado.
    await useCase.execute(command);
    // Verificamos que el repositorio reciba el valor false tal cual lo envio el usuario.
    expect(repo.create).toHaveBeenCalledWith({
      nombre: 'Depositos',
      descripcion: 'Almacenes de materiales',
      activo: false,
    });
  });
});

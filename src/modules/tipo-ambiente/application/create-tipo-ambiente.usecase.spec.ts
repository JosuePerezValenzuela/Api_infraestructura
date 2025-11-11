// Describimos las pruebas del caso de uso CreateTipoAmbienteUseCase dejando comentarios en cada paso para guiar a quien no programa.
import { BadRequestException, ConflictException } from '@nestjs/common';
// Importamos el caso de uso que implementaremos después para que estas pruebas fallen primero (fase RED del TDD).
import { CreateTipoAmbienteUseCase } from './create-tipo-ambiente.usecase';

// Definimos la forma del repositorio falso que utilizaremos en las pruebas.
interface FakeTipoAmbienteRepositoryPort {
  // create simula la inserción en base de datos y regresa el id nuevo.
  create: jest.Mock<
    Promise<{ id: number }>,
    [
      {
        nombre: string;
        descripcion: string;
        descripcion_corta?: string;
        activo: boolean;
      },
    ]
  >;
  // isNameTaken revisa si el nombre ya existe antes de intentar crear.
  isNameTaken: jest.Mock<Promise<boolean>, [string]>;
}

// Agrupamos todas las pruebas del caso de uso para entender el comportamiento completo.
describe('CreateTipoAmbienteUseCase', () => {
  // Función auxiliar para construir el sistema bajo prueba con diferentes escenarios.
  const buildSystem = (options?: { nameTaken?: boolean }) => {
    // nameTaken nos permite simular cuando el nombre ya existe.
    const nameTaken = options?.nameTaken ?? false;
    // Creamos el repositorio falso con Jest para controlar sus respuestas.
    const repo: FakeTipoAmbienteRepositoryPort = {
      create: jest.fn().mockResolvedValue({ id: 42 }),
      isNameTaken: jest.fn().mockResolvedValue(nameTaken),
    };
    // Instanciamos el caso de uso con el repositorio simulado.
    const useCase = new CreateTipoAmbienteUseCase(repo as unknown as any);
    // Retornamos los objetos para que cada prueba pueda inspeccionarlos.
    return { useCase, repo };
  };

  // Validamos el camino feliz donde se envían datos válidos.
  it('crea un tipo de ambiente con datos válidos', async () => {
    // Construimos el sistema con el nombre disponible.
    const { useCase, repo } = buildSystem();
    // Definimos el comando simulando los datos que llegan desde el DTO, con espacios adicionales.
    const command = {
      nombre: '  Laboratorio Clínico  ',
      descripcion: '  Espacio equipado para prácticas científicas  ',
      descripcion_corta: '  Lab clínico  ',
    };
    // Ejecutamos el caso de uso con el comando preparado.
    const result = await useCase.execute(command);
    // Revisamos que primero se haya consultado si el nombre (limpio) ya existe.
    expect(repo.isNameTaken).toHaveBeenCalledWith('Laboratorio Clínico');
    // Confirmamos que se llamó a create con los datos recortados y activo=true por defecto.
    expect(repo.create).toHaveBeenCalledWith({
      nombre: 'Laboratorio Clínico',
      descripcion: 'Espacio equipado para prácticas científicas',
      descripcion_corta: 'Lab clínico',
      activo: true,
    });
    // Verificamos que el resultado del caso de uso sea el id devuelto por el repositorio.
    expect(result).toEqual({ id: 42 });
  });

  // Comprobamos que se impide la creación cuando el nombre ya existe.
  it('lanza ConflictException si el nombre está ocupado', async () => {
    // Simulamos que el nombre ya está tomado.
    const { useCase, repo } = buildSystem({ nameTaken: true });
    // Definimos un comando válido.
    const command = {
      nombre: 'Aula Magna',
      descripcion: 'Espacio principal para eventos',
    };
    // Esperamos que el caso de uso rechace con ConflictException.
    await expect(useCase.execute(command)).rejects.toBeInstanceOf(
      ConflictException,
    );
    // Confirmamos que no se intentó crear el registro después del conflicto.
    expect(repo.create).not.toHaveBeenCalled();
  });

  // Verificamos las reglas de validación del nombre (obligatorio y máximo 64 caracteres).
  it('lanza BadRequestException si el nombre es inválido', async () => {
    // Construimos el sistema con el nombre disponible.
    const { useCase, repo } = buildSystem();
    // Definimos un comando con nombre vacío (solo espacios).
    const command = {
      nombre: '   ',
      descripcion: 'Descripcion válida',
    };
    // Esperamos que falle con BadRequestException.
    await expect(useCase.execute(command)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    // Validamos que no se interactuó con el repositorio porque la validación falló antes.
    expect(repo.isNameTaken).not.toHaveBeenCalled();
    expect(repo.create).not.toHaveBeenCalled();
  });

  // Validamos la longitud máxima de la descripción (256 caracteres).
  it('lanza BadRequestException si la descripción excede el máximo permitido', async () => {
    // Construimos el sistema con el nombre disponible.
    const { useCase, repo } = buildSystem();
    // Generamos una descripción demasiado larga.
    const command = {
      nombre: 'Sala de Innovación',
      descripcion: 'x'.repeat(300),
    };
    // Esperamos el error de validación.
    await expect(useCase.execute(command)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    // Confirmamos que no se consultó ni se intentó crear en el repositorio.
    expect(repo.isNameTaken).not.toHaveBeenCalled();
    expect(repo.create).not.toHaveBeenCalled();
  });

  // Revisamos la longitud opcional de descripcion_corta (32 caracteres máximo).
  it('lanza BadRequestException si la descripción corta supera 32 caracteres', async () => {
    // Construimos el sistema con el nombre disponible.
    const { useCase, repo } = buildSystem();
    // Definimos un comando con descripcion_corta demasiado extensa.
    const command = {
      nombre: 'Sala Makers',
      descripcion: 'Espacio colaborativo',
      descripcion_corta: 'x'.repeat(40),
    };
    // Ejecutamos esperando BadRequestException.
    await expect(useCase.execute(command)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    // Validamos que no hubo interacción con el repositorio.
    expect(repo.isNameTaken).not.toHaveBeenCalled();
    expect(repo.create).not.toHaveBeenCalled();
  });
});

// En este archivo describimos las pruebas del caso de uso UpdateTipoBloqueUseCase con comentarios pedagógicos.
// Importamos las excepciones que el caso de uso debe lanzar en diferentes situaciones.
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
// Importamos el caso de uso (que implementaremos después) para definir su comportamiento esperado.
import { UpdateTipoBloqueUseCase } from './update-tipo-bloque.usecase';
// Importamos el tipo que representa un registro de tipo de bloque para armar los datos simulados del repositorio.
import { TipoBloqueListItem } from '../domain/tipo-bloque.list.types';

// Definimos una interfaz que representa al repositorio falso que utilizaremos en las pruebas.
interface FakeTipoBloqueRepositoryPort {
  // findById devuelve el registro si existe o null en caso contrario.
  findById: jest.Mock<Promise<TipoBloqueListItem | null>, [number]>;
  // isNameTakenByOther comprueba si un nombre está utilizado por otro registro diferente al que editamos.
  isNameTakenByOther: jest.Mock<Promise<boolean>, [string, number]>;
  // update aplica los cambios y retorna el identificador actualizado.
  update: jest.Mock<Promise<{ id: number }>, [any]>;
}

// Creamos una función auxiliar que construye el caso de uso con diferentes configuraciones según la prueba.
const buildSystem = (options?: {
  existing?: TipoBloqueListItem | null;
  duplicatedName?: boolean;
}) => {
  // Obtenemos el registro existente a partir de las opciones o usamos un valor por defecto representativo.
  const existing: TipoBloqueListItem =
    options?.existing ??
    ({
      id: 7,
      nombre: 'Bloque original',
      descripcion: 'Descripcion original',
      activo: true,
      creado_en: new Date('2025-01-01T00:00:00.000Z'),
      actualizado_en: new Date('2025-01-02T00:00:00.000Z'),
    } as TipoBloqueListItem);
  // Determinamos si el nombre aparece duplicado en otro registro según la prueba.
  const duplicatedName = options?.duplicatedName ?? false;
  // Creamos el repositorio falso con las funciones simuladas mediante Jest.
  const repo: FakeTipoBloqueRepositoryPort = {
    findById: jest.fn().mockResolvedValue(options?.existing ?? existing),
    isNameTakenByOther: jest.fn().mockResolvedValue(duplicatedName),
    update: jest.fn().mockResolvedValue({ id: existing.id }),
  };
  // Instanciamos el caso de uso con el repositorio falso.
  const useCase = new UpdateTipoBloqueUseCase(repo as unknown as any);
  // Retornamos las dependencias para que cada prueba pueda usarlas.
  return { useCase, repo, existing };
};

// Agrupamos las pruebas del caso de uso dentro de describe.
describe('UpdateTipoBloqueUseCase', () => {
  // Este escenario feliz confirma que podemos actualizar múltiples campos y que los valores se recortan.
  it('actualiza un tipo de bloque recortando los valores enviados', async () => {
    // Construimos el sistema con un registro existente por defecto.
    const { useCase, repo, existing } = buildSystem();
    // Definimos la entrada simulando la petición del usuario con espacios extra.
    const input = {
      id: existing.id,
      nombre: '  Bloque renovado  ',
      descripcion: '  Espacios mixtos para clases y laboratorios  ',
      activo: false,
    };
    // Ejecutamos el caso de uso para aplicar los cambios.
    const result = await useCase.execute(input);
    // Verificamos que el repositorio consultó la existencia del registro por su id.
    expect(repo.findById).toHaveBeenCalledWith(existing.id);
    // Confirmamos que se revisó la unicidad del nombre utilizando el valor recortado.
    expect(repo.isNameTakenByOther).toHaveBeenCalledWith(
      'Bloque renovado',
      existing.id,
    );
    // Validamos que el repositorio de actualización recibió un comando con los valores limpios.
    expect(repo.update).toHaveBeenCalledWith({
      id: existing.id,
      nombre: 'Bloque renovado',
      descripcion: 'Espacios mixtos para clases y laboratorios',
      activo: false,
    });
    // El caso de uso debe devolver el mismo id confirmado por el repositorio.
    expect(result).toEqual({ id: existing.id });
  });

  // Este escenario confirma que no llamamos a la verificación de nombre cuando el usuario no envía ese campo.
  it('no consulta nombres duplicados cuando no se envia el nombre', async () => {
    // Construimos el sistema con un registro existente por defecto.
    const { useCase, repo, existing } = buildSystem();
    // Definimos un input que solo modifica el estado activo.
    const input = { id: existing.id, activo: false };
    // Ejecutamos el caso de uso.
    await useCase.execute(input);
    // Verificamos que findById fue invocado correctamente.
    expect(repo.findById).toHaveBeenCalledWith(existing.id);
    // Aseguramos que no se preguntó por nombres duplicados porque el nombre no cambió.
    expect(repo.isNameTakenByOther).not.toHaveBeenCalled();
    // Confirmamos que update se invocó solo con el campo cambiado.
    expect(repo.update).toHaveBeenCalledWith({
      id: existing.id,
      activo: false,
    });
  });

  // Esta prueba valida que se lance NotFoundException si el registro no existe.
  it('lanza NotFoundException cuando el tipo de bloque no existe', async () => {
    // Construimos el sistema haciendo que findById devuelva null simulando ausencia.
    const { useCase, repo } = buildSystem({ existing: null });
    // Definimos un input con el id inexistente.
    const input = { id: 999, nombre: 'Bloque X' };
    // Ejecutamos el caso de uso y esperamos que rechace con NotFoundException.
    await expect(useCase.execute(input)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    // Verificamos que solo se llamó a findById antes de lanzar la excepción.
    expect(repo.findById).toHaveBeenCalledWith(999);
    expect(repo.isNameTakenByOther).not.toHaveBeenCalled();
    expect(repo.update).not.toHaveBeenCalled();
  });

  // Esta prueba asegura que un nombre duplicado produzca ConflictException.
  it('lanza ConflictException cuando el nombre pertenece a otro registro', async () => {
    // Construimos el sistema señalando que el nombre está ocupado por otro registro.
    const { useCase, repo, existing } = buildSystem({ duplicatedName: true });
    // Definimos el input cambiando el nombre.
    const input = { id: existing.id, nombre: 'Bloque duplicado' };
    // Ejecutamos el caso de uso esperando el conflicto.
    await expect(useCase.execute(input)).rejects.toBeInstanceOf(
      ConflictException,
    );
    // Confirmamos que se consultó findById y luego la unicidad antes de fallar.
    expect(repo.findById).toHaveBeenCalledWith(existing.id);
    expect(repo.isNameTakenByOther).toHaveBeenCalledWith(
      'Bloque duplicado',
      existing.id,
    );
    // Aseguramos que no se intentó actualizar después del error.
    expect(repo.update).not.toHaveBeenCalled();
  });

  // Esta prueba evita que aceptemos nombres vacíos o inválidos.
  it('lanza BadRequestException si el nombre enviado queda vacio tras recortar', async () => {
    // Construimos el sistema con un registro válido.
    const { useCase, repo, existing } = buildSystem();
    // Definimos un input con espacios únicamente en el nombre.
    const input = { id: existing.id, nombre: '   ' };
    // Ejecutamos el caso de uso esperando la validación.
    await expect(useCase.execute(input)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    // Validamos que no se llegó a consultar la duplicidad ni a actualizar.
    expect(repo.isNameTakenByOther).not.toHaveBeenCalled();
    expect(repo.update).not.toHaveBeenCalled();
  });

  // Esta prueba cubre el caso en el que la descripción excede el máximo permitido.
  it('lanza BadRequestException si la descripcion supera 256 caracteres', async () => {
    // Construimos el sistema con un registro válido.
    const { useCase, repo, existing } = buildSystem();
    // Generamos una descripción muy larga para violar la regla.
    const longDescription = 'x'.repeat(300);
    // Definimos el input con la descripción inválida.
    const input = { id: existing.id, descripcion: longDescription };
    // Ejecutamos el caso de uso esperando el error de validación.
    await expect(useCase.execute(input)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    // Confirmamos que no se llamó a update ni a la verificación de duplicados.
    expect(repo.isNameTakenByOther).not.toHaveBeenCalled();
    expect(repo.update).not.toHaveBeenCalled();
  });

  // Esta prueba asegura que detectamos cuando el usuario no envía cambios efectivos.
  it('lanza BadRequestException si los valores enviados son iguales a los actuales', async () => {
    // Construimos el sistema con un registro cuyo nombre y descripcion ya están definidos.
    const { useCase, repo, existing } = buildSystem();
    // Definimos un input que repite exactamente los valores actuales.
    const input = {
      id: existing.id,
      nombre: existing.nombre,
      descripcion: existing.descripcion,
      activo: existing.activo,
    };
    // Ejecutamos el caso de uso esperando la validación.
    await expect(useCase.execute(input)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    // Verificamos que la verificación de duplicados se haya omitido y no se haya intentado actualizar.
    expect(repo.isNameTakenByOther).not.toHaveBeenCalled();
    expect(repo.update).not.toHaveBeenCalled();
  });
});

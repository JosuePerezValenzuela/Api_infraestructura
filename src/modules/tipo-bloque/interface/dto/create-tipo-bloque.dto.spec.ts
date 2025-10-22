// Esta prueba comprueba que CreateTipoBloqueDto valide los datos de entrada y explica cada paso en detalle.
// Importamos plainToInstance para transformar objetos planos en instancias de la clase DTO.
import { plainToInstance } from 'class-transformer';
// Importamos validate para ejecutar las validaciones declaradas en el DTO.
import { validate } from 'class-validator';
// Importamos el DTO que vamos a probar (aun no implementado) para describir su comportamiento.
import { CreateTipoBloqueDto } from './create-tipo-bloque.dto';

// Funcion auxiliar que valida un input y devuelve los errores como mensajes de texto simples.
const validateInput = async (input: Record<string, unknown>) => {
  // Convertimos el objeto plano en una instancia del DTO para que class-validator reconozca los decoradores.
  const dto = plainToInstance(CreateTipoBloqueDto, input);
  // Ejecutamos validate para obtener los errores detallados.
  const errors = await validate(dto);
  // Transformamos los errores a un arreglo de mensajes legibles para simplificar las aserciones.
  return errors.flatMap((error) => Object.values(error.constraints ?? {}));
};

// Agrupamos las pruebas en un describe para mantener organizado el comportamiento del DTO.
describe('CreateTipoBloqueDto', () => {
  // Este caso cubre el escenario feliz donde los datos cumplen las reglas.
  it('acepta un payload valido con nombre y descripcion', async () => {
    // Preparamos un objeto que representa la peticion correcta del usuario.
    const payload = {
      nombre: 'Edificio de aulas',
      descripcion: 'Edificio destinado al uso exclusivo para el dictado de clases',
    };
    // Ejecutamos la validacion y esperamos que no existan errores.
    const errors = await validateInput(payload);
    expect(errors).toHaveLength(0);
  });

  // Este caso asegura que el nombre no pueda venir vacio.
  it('rechaza un nombre vacio', async () => {
    // Preparamos un payload donde el nombre es una cadena vacia.
    const payload = {
      nombre: '',
      descripcion: 'Descripcion valida',
    };
    // Ejecutamos la validacion y esperamos un mensaje relacionado al nombre.
    const errors = await validateInput(payload);
    // Buscamos que el arreglo contenga el mensaje que declararemos en el DTO.
    expect(errors).toContain('El nombre no puede estar vacio');
  });

  // Este caso comprueba el limite superior de la longitud del nombre.
  it('rechaza un nombre que supera los 64 caracteres', async () => {
    // Generamos un nombre de 65 caracteres para violar la regla.
    const payload = {
      nombre: 'x'.repeat(65),
      descripcion: 'Descripcion valida',
    };
    const errors = await validateInput(payload);
    expect(errors).toContain(
      'El nombre no debe exceder los 64 caracteres',
    );
  });

  // Este caso cubre la validacion de descripcion requerida.
  it('rechaza una descripcion vacia', async () => {
    const payload = {
      nombre: 'Edificio de aulas',
      descripcion: '',
    };
    const errors = await validateInput(payload);
    expect(errors).toContain('La descripcion no puede estar vacia');
  });

  // Este caso valida el limite superior de la descripcion.
  it('rechaza una descripcion que supera los 256 caracteres', async () => {
    const payload = {
      nombre: 'Edificio de aulas',
      descripcion: 'x'.repeat(257),
    };
    const errors = await validateInput(payload);
    expect(errors).toContain(
      'La descripcion no debe exceder los 256 caracteres',
    );
  });
});

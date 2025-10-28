// Esta prueba define el comportamiento esperado del DTO de actualización y explica cada paso para quien está aprendiendo.
// Importamos plainToInstance para convertir objetos en instancias del DTO y así habilitar los decoradores de validación.
import { plainToInstance } from 'class-transformer';
// Importamos validate para ejecutar las reglas declaradas dentro del DTO.
import { validate } from 'class-validator';
// Importamos el DTO que vamos a describir; la implementación vendrá después en la fase GREEN.
import { UpdateTipoBloqueDto } from './update-tipo-bloque.dto';

// Creamos una función auxiliar que prepara la instancia y devuelve las descripciones simples de los errores.
const validatePayload = async (payload: Record<string, unknown>) => {
  // Convertimos el payload plano en una instancia del DTO para que class-validator lea sus decoradores.
  const instance = plainToInstance(UpdateTipoBloqueDto, payload);
  // Ejecutamos las validaciones configuradas en el DTO.
  const validationErrors = await validate(instance);
  // Transformamos los errores a un arreglo de mensajes entendibles para simplificar las aserciones.
  return validationErrors.flatMap((error) => Object.values(error.constraints ?? {}));
};

// Agrupamos las pruebas bajo el mismo describe para mantener organizado el comportamiento del DTO.
describe('UpdateTipoBloqueDto', () => {
  // Este escenario feliz confirma que actualizar solo el nombre con un valor válido pasa las validaciones.
  it('acepta actualizar únicamente el nombre cuando es válido', async () => {
    // Preparamos un payload con un nombre dentro del rango permitido.
    const payload = { nombre: 'Bloque de laboratorios' };
    // Validamos el payload y esperamos que no existan errores.
    const errors = await validatePayload(payload);
    expect(errors).toHaveLength(0);
  });

  // Este escenario feliz confirma que actualizar únicamente la descripción también es válido.
  it('acepta actualizar únicamente la descripcion cuando es valida', async () => {
    // Preparamos un payload con una descripción explicativa.
    const payload = {
      descripcion: 'Bloque destinado a laboratorios especializados',
    };
    // Ejecutamos la validación y verificamos que el arreglo de errores esté vacío.
    const errors = await validatePayload(payload);
    expect(errors).toHaveLength(0);
  });

  // Este escenario feliz cubre la actualización del estado activo.
  it('acepta actualizar únicamente el estado activo', async () => {
    // Preparamos un payload donde solo se envía el campo booleano.
    const payload = { activo: false };
    // Validamos el payload y esperamos ausencia de errores.
    const errors = await validatePayload(payload);
    expect(errors).toHaveLength(0);
  });

  // Esta prueba asegura que el usuario no pueda enviar un payload vacío.
  it('rechaza un payload vacío sin campos permitidos', async () => {
    // Preparamos un objeto vacío que representa una petición sin datos.
    const payload = {};
    // Ejecutamos la validación y verificamos que aparezca el mensaje que exigirá al menos un campo enviado.
    const errors = await validatePayload(payload);
    expect(errors).toContain('Debes enviar al menos un campo para actualizar el tipo de bloque');
  });

  // Esta prueba verifica que el nombre no pueda ser una cadena vacía cuando se envía.
  it('rechaza un nombre vacio', async () => {
    // Preparamos un payload con el nombre vacío.
    const payload = { nombre: '' };
    // Validamos y esperamos el mensaje que indica la regla de longitud mínima.
    const errors = await validatePayload(payload);
    expect(errors).toContain('El nombre debe tener entre 1 y 64 caracteres cuando se envia');
  });

  // Esta prueba garantiza que el nombre no exceda el límite superior.
  it('rechaza un nombre con mas de 64 caracteres', async () => {
    // Generamos un nombre largo para violar la regla.
    const payload = { nombre: 'x'.repeat(65) };
    // Validamos y esperamos el mensaje específico del límite superior.
    const errors = await validatePayload(payload);
    expect(errors).toContain('El nombre debe tener entre 1 y 64 caracteres cuando se envia');
  });

  // Esta prueba verifica que la descripción no pueda ser vacía.
  it('rechaza una descripcion vacia', async () => {
    // Preparamos un payload con la descripción vacía.
    const payload = { descripcion: '' };
    // Ejecutamos la validación y esperamos un mensaje claro para el usuario.
    const errors = await validatePayload(payload);
    expect(errors).toContain('La descripcion debe tener entre 1 y 256 caracteres cuando se envia');
  });

  // Esta prueba controla el límite superior de la descripción.
  it('rechaza una descripcion con mas de 256 caracteres', async () => {
    // Generamos una descripción que excede el límite permitido.
    const payload = { descripcion: 'x'.repeat(257) };
    // Validamos y esperamos el mensaje que se definirá en el DTO.
    const errors = await validatePayload(payload);
    expect(errors).toContain('La descripcion debe tener entre 1 y 256 caracteres cuando se envia');
  });

  // Esta prueba confirma que activo debe ser estrictamente booleano.
  it('rechaza un activo que no sea booleano', async () => {
    // Preparamos un payload donde activo viene como cadena.
    const payload = { activo: 'true' };
    // Validamos y esperamos el mensaje que explica el formato correcto.
    const errors = await validatePayload(payload);
    expect(errors).toContain('El estado activo debe ser verdadero o falso');
  });
});

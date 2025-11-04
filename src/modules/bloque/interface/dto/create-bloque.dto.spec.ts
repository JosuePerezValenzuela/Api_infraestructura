// En este archivo describimos las pruebas del DTO CreateBloqueDto y documentamos cada paso para enseñar a programar desde cero.
// Importamos plainToInstance para transformar un objeto normal en una instancia real del DTO y que así se apliquen las validaciones.
import { plainToInstance } from 'class-transformer';
// Importamos validate de class-validator; esta función recorre los decoradores del DTO y nos dice qué reglas se incumplen.
import { validate } from 'class-validator';
// Importamos el DTO que vamos a probar (se implementará después siguiendo estas expectativas).
import { CreateBloqueDto } from './create-bloque.dto';

// Creamos una función auxiliar que recibe un payload y devuelve los mensajes de error simples.
const validateInput = async (input: Record<string, unknown>) => {
  // Convertimos el objeto plano en una instancia del DTO para activar los decoradores de validación.
  const dto = plainToInstance(CreateBloqueDto, input);
  // Ejecutamos la validación y obtenemos un arreglo con todos los errores detectados.
  const errors = await validate(dto);
  // Cada error puede tener varias reglas incumplidas; aquí juntamos todos los mensajes en un único arreglo de texto.
  return errors.flatMap((error) => Object.values(error.constraints ?? {}));
};

// Agrupamos todas las pruebas bajo el mismo describe para mantener organizado el comportamiento del DTO.
describe('CreateBloqueDto', () => {
  // Este caso representa el camino feliz: un payload correcto no debe generar errores.
  it('acepta un payload valido con todos los campos necesarios', async () => {
    // Definimos un objeto que refleja la petición válida enviada desde el frontend.
    const payload = {
      codigo: 'BLOQUE-101',
      nombre: 'Bloque Central de Ingenieria',
      nombre_corto: 'Ing Central',
      lat: -17.3937,
      lng: -66.1568,
      pisos: 4,
      activo: true,
      facultad_id: 1,
      tipo_bloque_id: 2,
    };
    // Ejecutamos la validación del DTO con el payload creado.
    const errors = await validateInput(payload);
    // Verificamos que no se reporten mensajes de error cuando todo es correcto.
    expect(errors).toHaveLength(0);
  });

  // Aquí probamos que el campo codigo sea obligatorio.
  it('rechaza cuando codigo no esta presente', async () => {
    // Reutilizamos un payload válido pero omitiendo el campo codigo para forzar el error esperado.
    const payload = {
      nombre: 'Bloque Central de Ingenieria',
      nombre_corto: 'Ing Central',
      lat: -17.3937,
      lng: -66.1568,
      pisos: 4,
      activo: true,
      facultad_id: 1,
      tipo_bloque_id: 2,
    };
    // Validamos el payload incompleto para obtener los mensajes del DTO.
    const errors = await validateInput(payload);
    // Confirmamos que se anuncie que el código es obligatorio.
    expect(errors).toContain('El codigo es obligatorio');
  });

  // Validamos que el código no exceda los 16 caracteres definidos en la especificación.
  it('rechaza un codigo que excede los 16 caracteres permitidos', async () => {
    // Construimos un código demasiado largo para romper la regla de longitud máxima.
    const payload = {
      codigo: 'BLOQUE-1234567890',
      nombre: 'Bloque Central de Ingenieria',
      nombre_corto: 'Ing Central',
      lat: -17.3937,
      lng: -66.1568,
      pisos: 4,
      activo: true,
      facultad_id: 1,
      tipo_bloque_id: 2,
    };
    // Ejecutamos la validación para capturar los errores.
    const errors = await validateInput(payload);
    // Esperamos el mensaje que explica claramente el problema al usuario.
    expect(errors).toContain('El codigo no debe exceder los 16 caracteres');
  });

  // Este caso asegura que el nombre sea obligatorio y no pueda ir vacío.
  it('rechaza un nombre vacio o ausente', async () => {
    // Creamos un payload que envía un nombre vacío para simular un formulario sin completar.
    const payload = {
      codigo: 'BLOQUE-101',
      nombre: '',
      nombre_corto: 'Ing Central',
      lat: -17.3937,
      lng: -66.1568,
      pisos: 4,
      activo: true,
      facultad_id: 1,
      tipo_bloque_id: 2,
    };
    // Ejecutamos la validación.
    const errors = await validateInput(payload);
    // Comprobamos que se informe al usuario que el nombre no puede quedar vacío.
    expect(errors).toContain('El nombre no puede estar vacio');
  });

  // Verificamos que el nombre corto, aunque opcional, respete la longitud máxima.
  it('rechaza un nombre_corto que supera los 16 caracteres', async () => {
    // Enviamos un nombre_corto largo para reproducir la situación problemática.
    const payload = {
      codigo: 'BLOQUE-101',
      nombre: 'Bloque Central de Ingenieria',
      nombre_corto: 'Nombre corto demasiado largo',
      lat: -17.3937,
      lng: -66.1568,
      pisos: 4,
      activo: true,
      facultad_id: 1,
      tipo_bloque_id: 2,
    };
    // Validamos el payload y recopilamos los errores.
    const errors = await validateInput(payload);
    // Confirmamos que se indique el límite de 16 caracteres para el nombre corto.
    expect(errors).toContain(
      'El nombre_corto no debe exceder los 16 caracteres',
    );
  });

  // Esta prueba comprueba que los campos lat y lng deben enviarse juntos.
  it('exige que lat y lng se envien en pareja', async () => {
    // Mandamos lat sin lng para reflejar un formulario incompleto.
    const payload = {
      codigo: 'BLOQUE-101',
      nombre: 'Bloque Central de Ingenieria',
      nombre_corto: 'Ing Central',
      lat: -17.3937,
      pisos: 4,
      activo: true,
      facultad_id: 1,
      tipo_bloque_id: 2,
    };
    // Validamos el payload defectuoso.
    const errors = await validateInput(payload);
    // Esperamos el mensaje que recuerda enviar ambos valores en simultáneo.
    expect(errors).toContain('Debes enviar lat y lng al mismo tiempo');
  });

  // Aquí verificamos que la latitud esté dentro del rango aceptado por el negocio.
  it('rechaza una latitud fuera del rango permitido', async () => {
    // Usamos una latitud de 120 para violar el rango [-90, 90].
    const payload = {
      codigo: 'BLOQUE-101',
      nombre: 'Bloque Central de Ingenieria',
      nombre_corto: 'Ing Central',
      lat: 120,
      lng: -66.1568,
      pisos: 4,
      activo: true,
      facultad_id: 1,
      tipo_bloque_id: 2,
    };
    // Validamos para recoger los errores.
    const errors = await validateInput(payload);
    // La expectativa es que se informe que la latitud está fuera del rango.
    expect(errors).toContain('La latitud debe estar entre -90 y 90');
  });

  // Probamos que la cantidad de pisos sea un entero entre 1 y 99.
  it('rechaza un numero de pisos fuera del rango 1-99', async () => {
    // Definimos pisos en 0 para simular un valor inválido.
    const payload = {
      codigo: 'BLOQUE-101',
      nombre: 'Bloque Central de Ingenieria',
      nombre_corto: 'Ing Central',
      lat: -17.3937,
      lng: -66.1568,
      pisos: 0,
      activo: true,
      facultad_id: 1,
      tipo_bloque_id: 2,
    };
    // Validamos el payload incorrecto.
    const errors = await validateInput(payload);
    // Confirmamos el mensaje que describe el rango válido de pisos.
    expect(errors).toContain('Los pisos deben ser un entero entre 1 y 99');
  });

  // Finalmente validamos que los identificadores de relaciones sean números positivos.
  it('exige identificadores de facultad y tipo de bloque validos', async () => {
    // Enviamos identificadores negativos para reproducir el escenario inválido.
    const payload = {
      codigo: 'BLOQUE-101',
      nombre: 'Bloque Central de Ingenieria',
      nombre_corto: 'Ing Central',
      lat: -17.3937,
      lng: -66.1568,
      pisos: 4,
      activo: true,
      facultad_id: -1,
      tipo_bloque_id: 0,
    };
    // Ejecutamos la validación.
    const errors = await validateInput(payload);
    // Esperamos mensajes que hablen de identificadores positivos.
    expect(errors).toContain(
      'La facultad asociada debe ser un numero entero positivo',
    );
    expect(errors).toContain(
      'El tipo de bloque asociado debe ser un numero entero positivo',
    );
  });
});

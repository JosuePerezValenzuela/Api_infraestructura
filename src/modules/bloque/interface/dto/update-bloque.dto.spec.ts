// En este archivo creamos las pruebas del DTO UpdateBloqueDto y explicamos cada paso para quienes estan aprendiendo desde cero.
// Importamos plainToInstance para convertir un objeto plano en una instancia real del DTO y asi activar los validadores.
import { plainToInstance } from 'class-transformer';
// Importamos validate de class-validator para ejecutar todas las reglas declaradas en el DTO.
import { validate } from 'class-validator';
// Importamos el DTO que vamos a probar; se implementara despues siguiendo los comportamientos descritos aqui.
import { UpdateBloqueDto } from './update-bloque.dto';

// Creamos una funcion auxiliar que recibe un payload y devuelve la lista plana de mensajes de error.
const validateInput = async (input: Record<string, unknown>) => {
  // Transformamos el objeto plano en una instancia real del DTO para que se apliquen los decoradores de validacion.
  const dto = plainToInstance(UpdateBloqueDto, input);
  // Ejecutamos la validacion y obtenemos los errores generados.
  const errors = await validate(dto);
  // Aplanamos los mensajes de cada error para trabajar con un arreglo simple de strings.
  return errors.flatMap((error) => Object.values(error.constraints ?? {}));
};

// Agrupamos todas las pruebas del DTO bajo un describe para mantener el orden.
describe('UpdateBloqueDto', () => {
  // Este caso representa un camino feliz donde todos los campos opcionales cumplen las reglas.
  it('acepta un payload valido con campos opcionales', async () => {
    // Definimos un objeto que simula una peticion valida enviada desde el cliente.
    const payload = {
      codigo: 'BLOQUE-200',
      nombre: 'Bloque de Laboratorios',
      nombre_corto: 'Lab Central',
      pisos: 5,
      lat: -17.39,
      lng: -66.15,
      activo: false,
      facultad_id: 3,
      tipo_bloque_id: 2,
    };
    // Ejecutamos la validacion del DTO con el payload anterior.
    const errors = await validateInput(payload);
    // Comprobamos que no se produzcan mensajes de error cuando todo es correcto.
    expect(errors).toHaveLength(0);
  });

  // Verificamos que el codigo no supere el limite de 16 caracteres.
  it('rechaza un codigo mayor a 16 caracteres', async () => {
    // Creamos un payload valido y modificamos el codigo para que sea demasiado largo.
    const payload = {
      codigo: 'BLOQUE-1234567890',
      nombre: 'Bloque Norte',
      nombre_corto: 'Norte',
      pisos: 4,
      lat: -17.39,
      lng: -66.15,
      activo: true,
      facultad_id: 1,
      tipo_bloque_id: 2,
    };
    // Ejecutamos la validacion para obtener los mensajes generados.
    const errors = await validateInput(payload);
    // Confirmamos que el DTO informe que el codigo supera el limite permitido.
    expect(errors).toContain('El codigo no debe exceder los 16 caracteres');
  });

  // Validamos que un codigo vacio no sea aceptado cuando se envia.
  it('rechaza un codigo vacio cuando se envia', async () => {
    // Enviamos un codigo vacio para simular un formulario sin completar.
    const payload = {
      codigo: '',
      nombre: 'Bloque Norte',
      nombre_corto: 'Norte',
      pisos: 4,
      lat: -17.39,
      lng: -66.15,
      activo: true,
      facultad_id: 1,
      tipo_bloque_id: 2,
    };
    // Ejecutamos la validacion del DTO.
    const errors = await validateInput(payload);
    // Esperamos un mensaje claro que explique que el codigo no puede ir vacio.
    expect(errors).toContain('El codigo no puede estar vacio');
  });

  // Revisamos que el nombre respete la longitud maxima de 128 caracteres.
  it('rechaza un nombre que excede los 128 caracteres', async () => {
    // Construimos un nombre demasiado largo concatenando mas de 128 caracteres.
    const payload = {
      codigo: 'BLOQUE-201',
      nombre:
        'Bloque que tiene un nombre extremadamente largo para probar la validacion y asegurar que la regla corta el texto cuando supera el limite',
      nombre_corto: 'Centro',
      pisos: 3,
      lat: -17.39,
      lng: -66.15,
      activo: true,
      facultad_id: 1,
      tipo_bloque_id: 2,
    };
    // Ejecutamos la validacion para capturar los mensajes de error.
    const errors = await validateInput(payload);
    // Confirmamos que se informe que el nombre excede el limite permitido.
    expect(errors).toContain('El nombre no debe exceder los 128 caracteres');
  });

  // Comprobamos que un nombre vacio sea rechazado.
  it('rechaza un nombre vacio cuando se envia', async () => {
    // Enviamos un nombre vacio replicando la accion de borrar el contenido desde la interfaz.
    const payload = {
      codigo: 'BLOQUE-201',
      nombre: '',
      nombre_corto: 'Centro',
      pisos: 3,
      lat: -17.39,
      lng: -66.15,
      activo: true,
      facultad_id: 1,
      tipo_bloque_id: 2,
    };
    // Ejecutamos la validacion sobre el payload incompleto.
    const errors = await validateInput(payload);
    // Verificamos que se explique que el nombre no puede quedar vacio.
    expect(errors).toContain('El nombre no puede estar vacio');
  });

  // Evaluamos que el nombre_corto respete el limite de 16 caracteres.
  it('rechaza un nombre_corto que supera los 16 caracteres', async () => {
    // Definimos un nombre_corto largo para disparar la validacion.
    const payload = {
      codigo: 'BLOQUE-300',
      nombre: 'Bloque Central',
      nombre_corto: 'Nombre corto demasiado largo',
      pisos: 2,
      lat: -17.39,
      lng: -66.15,
      activo: true,
      facultad_id: 1,
      tipo_bloque_id: 2,
    };
    // Validamos el payload y registramos los errores.
    const errors = await validateInput(payload);
    // Esperamos el mensaje que advierte sobre el limite de 16 caracteres.
    expect(errors).toContain(
      'El nombre_corto no debe exceder los 16 caracteres',
    );
  });

  // Confirmamos que el nombre_corto no pueda quedar vacio si se envia.
  it('rechaza un nombre_corto vacio cuando se incluye', async () => {
    // Mandamos el nombre_corto como cadena vacia para simular una entrada incompleta.
    const payload = {
      codigo: 'BLOQUE-300',
      nombre: 'Bloque Central',
      nombre_corto: '',
      pisos: 2,
      lat: -17.39,
      lng: -66.15,
      activo: true,
      facultad_id: 1,
      tipo_bloque_id: 2,
    };
    // Ejecutamos la validacion para obtener los mensajes de error.
    const errors = await validateInput(payload);
    // Confirmamos que se informe que el campo no puede ir vacio.
    expect(errors).toContain('El nombre_corto no puede estar vacio');
  });

  // Probamos que lat y lng deban enviarse en pareja.
  it('exige que lat y lng lleguen juntos', async () => {
    // Enviamos solo lat para forzar la regla que exige el par completo.
    const payload = {
      nombre: 'Bloque Central',
      pisos: 2,
      lat: -17.39,
    };
    // Ejecutamos la validacion con el payload incompleto.
    const errors = await validateInput(payload);
    // Esperamos el mensaje que recuerda enviar lat y lng al mismo tiempo.
    expect(errors).toContain('Debes enviar lat y lng juntos');
  });

  // Controlamos que la latitud se mantenga en el rango valido.
  it('rechaza una latitud fuera del rango permitido', async () => {
    // Asignamos una latitud invalida para generar la alerta correspondiente.
    const payload = {
      lat: 120,
      lng: -66.15,
    };
    // Ejecutamos la validacion y analizamos los mensajes devueltos.
    const errors = await validateInput(payload);
    // Confirmamos que se informe que la latitud supera el rango aceptado.
    expect(errors).toContain('La latitud debe estar entre -90 y 90');
  });

  // Validamos que la longitud tambien se mantenga dentro del rango permitido.
  it('rechaza una longitud fuera del rango permitido', async () => {
    // Enviamos una longitud invalida acompanada de una latitud correcta.
    const payload = {
      lat: -17.39,
      lng: 190,
    };
    // Ejecutamos la validacion para obtener los errores.
    const errors = await validateInput(payload);
    // Verificamos que se indique que la longitud esta fuera del rango valido.
    expect(errors).toContain('La longitud debe estar entre -180 y 180');
  });

  // Revisamos que la cantidad de pisos se encuentre entre 1 y 99.
  it('rechaza un valor de pisos fuera del rango 1-99', async () => {
    // Establecemos pisos en 0 para romper la regla del rango valido.
    const payload = {
      pisos: 0,
    };
    // Ejecutamos la validacion con el valor incorrecto.
    const errors = await validateInput(payload);
    // Esperamos el mensaje que explica el rango permitido de pisos.
    expect(errors).toContain('Los pisos deben ser un entero entre 1 y 99');
  });

  // Aseguramos que el campo activo solo acepte valores booleanos.
  it('rechaza un valor no booleano en activo', async () => {
    // Mandamos una cadena en activo para simular un error comun.
    const payload = {
      activo: 'yes',
    };
    // Ejecutamos la validacion del DTO.
    const errors = await validateInput(payload);
    // Confirmamos que se indique que el campo debe ser booleano.
    expect(errors).toContain('El campo activo debe ser booleano');
  });

  // Revisamos que facultad_id sea un entero positivo cuando se envia.
  it('requiere que facultad_id sea un entero positivo', async () => {
    // Configuramos un identificador negativo para provocar la validacion.
    const payload = {
      facultad_id: -1,
    };
    // Ejecutamos la validacion y observamos los mensajes.
    const errors = await validateInput(payload);
    // Confirmamos que se explique que el valor debe ser un entero positivo.
    expect(errors).toContain(
      'La facultad indicada debe ser un numero entero positivo',
    );
  });

  // Probamos la misma regla para tipo_bloque_id.
  it('requiere que tipo_bloque_id sea un entero positivo', async () => {
    // Enviamos un identificador no valido para el tipo de bloque.
    const payload = {
      tipo_bloque_id: 0,
    };
    // Ejecutamos la validacion y obtenemos los errores.
    const errors = await validateInput(payload);
    // Verificamos que el mensaje explique la regla del entero positivo.
    expect(errors).toContain(
      'El tipo de bloque indicado debe ser un numero entero positivo',
    );
  });
});

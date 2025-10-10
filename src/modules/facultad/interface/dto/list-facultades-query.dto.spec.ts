// Este archivo contiene pruebas para el DTO ListFacultadesQueryDto y explica cada linea para que cualquier persona entienda la validacion.
// Importamos plainToInstance para convertir objetos simples en instancias de la clase DTO.
import { plainToInstance } from 'class-transformer';
// Importamos validate para ejecutar las reglas de class-validator y observar errores.
import { validate } from 'class-validator';
// Importamos el DTO que aun no existe pero que describiremos mediante estas pruebas.
import { ListFacultadesQueryDto } from './list-facultades-query.dto';

describe('ListFacultadesQueryDto', () => {
  // Esta prueba confirma que el DTO acepta valores vacios aplicando los defaults esperados.
  it('acepta parametros vacios aplicando valores por defecto', async () => {
    // Convertimos un objeto vacio en una instancia del DTO.
    const dto = plainToInstance(ListFacultadesQueryDto, {});
    // Ejecutamos la validacion para capturar posibles errores.
    const errors = await validate(dto);
    // Confirmamos que no hubo errores porque los defaults son validos.
    expect(errors).toHaveLength(0);
  });

  // Esta prueba comprueba que la pagina debe ser mayor o igual a 1.
  it('rechaza cuando page es menor a 1', async () => {
    // Creamos una instancia del DTO usando page igual a 0 para simular el error.
    const dto = plainToInstance(ListFacultadesQueryDto, { page: 0 });
    // Ejecutamos la validacion para obtener los errores.
    const errors = await validate(dto);
    // Verificamos que exista al menos un error.
    expect(errors.length).toBeGreaterThan(0);
    // Confirmamos que el error reporta especificamente el campo page.
    expect(errors[0].property).toBe('page');
  });

  // Esta prueba verifica que solamente aceptaremos los valores asc o desc para orderDir.
  it('rechaza cuando orderDir no es asc ni desc', async () => {
    // Instanciamos el DTO con orderDir invalido.
    const dto = plainToInstance(ListFacultadesQueryDto, {
      orderDir: 'sideways',
    });
    // Validamos el DTO para observar los errores generados.
    const errors = await validate(dto);
    // Confirmamos que hubo errores de validacion.
    expect(errors.length).toBeGreaterThan(0);
    // El primer error debe pertenecer a la propiedad orderDir.
    expect(errors[0].property).toBe('orderDir');
  });
});

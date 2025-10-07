// Este archivo de pruebas explica paso a paso como funciona el valor GeoPoint.
// Importamos la clase GeoPoint que vamos a probar cuando exista la implementacion real.
import { GeoPoint } from './geo-point.vo';

describe('GeoPoint', () => {
  // Este primer caso muestra la creacion exitosa de un punto geografico con datos validos.
  it('crea un punto valido cuando la latitud y la longitud estan dentro del rango permitido', () => {
    // Definimos la latitud de Cochabamba en grados decimales.
    const latitud = -17.3939;
    // Definimos la longitud de Cochabamba en grados decimales.
    const longitud = -66.15;
    // Solicitamos a GeoPoint que genere un punto usando la latitud y la longitud anteriores.
    const punto = GeoPoint.create({ lat: latitud, lng: longitud });
    // Comprobamos que el punto devuelto conserve exactamente la latitud que enviamos.
    expect(punto.lat).toBe(latitud);
    // Comprobamos que el punto devuelto conserve exactamente la longitud que enviamos.
    expect(punto.lng).toBe(longitud);
  });

  // Este caso cubre el error cuando se entrega solo la latitud sin la longitud correspondiente.
  it('lanza un error si se envia latitud sin longitud', () => {
    // Definimos solo la latitud para simular un dato incompleto.
    const latitud = -17.0;
    // Usamos una funcion flecha para capturar la excepcion que esperamos que se lance.
    const crearSinLongitud = () => GeoPoint.create({ lat: latitud, lng: undefined as unknown as number });
    // Validamos que la funcion dispare un error con el mensaje indicado en las reglas de la HU.
    expect(crearSinLongitud).toThrow('Si se envia lat tambien se debe enviar lng y viceversa');
  });

  // Este caso cubre el error cuando la latitud esta fuera del rango permitido por la Tierra.
  it('lanza un error si la latitud esta fuera del rango -90 a 90', () => {
    // Definimos una latitud imposible por ser menor a -90 grados.
    const latitudInvalida = -95;
    // Definimos una longitud cualquiera valida porque el problema esta en la latitud.
    const longitudValida = -66.15;
    // Preparamos la funcion que intenta crear el punto con la latitud invalida.
    const crearLatitudInvalida = () => GeoPoint.create({ lat: latitudInvalida, lng: longitudValida });
    // Comprobamos que se lance el mensaje de error que explica que la latitud no es valida.
    expect(crearLatitudInvalida).toThrow('Latitud invalida');
  });

  // Este caso cubre el error cuando la longitud esta fuera del rango permitido.
  it('lanza un error si la longitud esta fuera del rango -180 a 180', () => {
    // Definimos una longitud superior a 180 grados, lo cual no existe en el planeta.
    const longitudInvalida = 200;
    // Definimos una latitud valida porque el problema esta solo en la longitud.
    const latitudValida = -17.3939;
    // Preparamos la funcion que intenta crear el punto con la longitud invalida.
    const crearLongitudInvalida = () => GeoPoint.create({ lat: latitudValida, lng: longitudInvalida });
    // Verificamos que el mensaje de error explique que la longitud no es valida.
    expect(crearLongitudInvalida).toThrow('Longitud invalida');
  });

  // Este caso demuestra como obtener el literal que se usara en PostgreSQL para guardar el punto.
  it('devuelve el literal point de PostgreSQL con el orden (lng, lat)', () => {
    // Definimos la latitud de Cochabamba para el ejemplo.
    const latitud = -17.3939;
    // Definimos la longitud de Cochabamba para el ejemplo.
    const longitud = -66.15;
    // Creamos el punto valido usando la fabrica de GeoPoint.
    const punto = GeoPoint.create({ lat: latitud, lng: longitud });
    // Solicitamos el literal que espera PostgreSQL: primero la longitud (x) y luego la latitud (y).
    const literal = punto.toPostgresPointLiteral();
    // Comprobamos que el literal coincida con el formato que espera la base de datos.
    expect(literal).toBe('(-66.15,-17.3939)');
  });
});
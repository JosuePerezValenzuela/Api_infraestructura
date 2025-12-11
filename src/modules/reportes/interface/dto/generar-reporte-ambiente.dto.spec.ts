import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  GenerarReporteAmbienteDto,
  ReporteAmbienteFormato,
} from './generar-reporte-ambiente.dto';

describe('GenerarReporteAmbienteDto', () => {
  it('acepta un payload valido', async () => {
    // Creamos un objeto comun con datos correctos para simular la entrada del usuario.
    const payload = {
      // Codigo identificador del ambiente que se va a reportar.
      codigo: 'FCyT-001',
      // Formato solicitado, en este caso PDF.
      formato: ReporteAmbienteFormato.PDF,
    };
    // Convertimos el objeto plano en una instancia de DTO para que las validaciones puedan correr.
    const dto = plainToInstance(GenerarReporteAmbienteDto, payload);
    // Ejecutamos la validacion asincrona del DTO para recolectar posibles errores.
    const errors = await validate(dto);
    // Confirmamos que no se encontraron errores cuando los datos son validos.
    expect(errors).toHaveLength(0);
  });

  it('rechaza cuando falta el codigo', async () => {
    // Construimos un payload sin el campo codigo para provocar un error de validacion.
    const payload = {
      // Enviamos solo el formato valido para aislar el error del codigo faltante.
      formato: ReporteAmbienteFormato.EXCEL,
    };
    // Creamos la instancia del DTO a partir del payload incompleto.
    const dto = plainToInstance(GenerarReporteAmbienteDto, payload);
    // Validamos el DTO y capturamos la lista de errores generados.
    const errors = await validate(dto);
    // Verificamos que exista al menos un error porque falta el codigo.
    expect(errors.length).toBeGreaterThan(0);
    // Revisamos que el primer error este asociado al campo codigo.
    expect(errors[0].property).toBe('codigo');
  });

  it('rechaza un formato no permitido', async () => {
    // Payload con codigo valido pero formato invalido para forzar error en ese campo.
    const payload = {
      // Codigo correcto para centrar la prueba en el formato.
      codigo: 'FCyT-002',
      // Valor que no esta en el listado de formatos permitidos.
      formato: 'docx',
    };
    // Transformamos el payload a DTO para aplicar las reglas de validacion.
    const dto = plainToInstance(GenerarReporteAmbienteDto, payload);
    // Ejecutamos la validacion y recogemos los errores resultantes.
    const errors = await validate(dto);
    // Esperamos al menos un error porque el formato no es aceptado.
    expect(errors.length).toBeGreaterThan(0);
    // El error debe apuntar al campo formato para indicar el problema especifico.
    expect(errors[0].property).toBe('formato');
  });
});

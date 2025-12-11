import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  GenerarReporteInventarioDto,
  ReporteFormato,
  ReporteScope,
} from './generar-reporte-inventario.dto';

describe('GenerarReporteInventarioDto', () => {
  it('acepta un payload válido', async () => {
    // Creamos un objeto plano con datos correctos para todos los campos requeridos.
    const payload = {
      scope: ReporteScope.CAMPUS,
      scopeId: 1,
      formato: ReporteFormato.XLSX,
      locale: 'es-BO',
    };
    // Convertimos el objeto plano a una instancia de DTO para que class-validator pueda evaluarlo.
    const dto = plainToInstance(GenerarReporteInventarioDto, payload);
    // Ejecutamos la validación del DTO y recogemos los errores.
    const errors = await validate(dto);
    // Verificamos que no existan errores de validación cuando los datos son correctos.
    expect(errors).toHaveLength(0);
  });

  it('rechaza scope no permitido', async () => {
    // Construimos un payload con un scope inválido que no está en el enum.
    const payload = {
      scope: 'invalid-scope',
      scopeId: 'uuid-cualquiera',
      formato: ReporteFormato.PDF,
    };
    // Convertimos el payload a instancia de DTO.
    const dto = plainToInstance(GenerarReporteInventarioDto, payload);
    // Validamos el DTO y obtenemos los errores resultantes.
    const errors = await validate(dto);
    // Esperamos al menos un error debido al scope inválido.
    expect(errors.length).toBeGreaterThan(0);
    // Confirmamos que el primer error esté asociado al campo scope.
    expect(errors[0].property).toBe('scope');
  });

  it('rechaza formato no permitido y scopeId vacío', async () => {
    // Payload con formato inválido y scopeId vacío para disparar dos errores.
    const payload = {
      scope: ReporteScope.FACULTAD,
      scopeId: '',
      formato: 'docx',
    };
    // Creamos la instancia del DTO para validarla.
    const dto = plainToInstance(GenerarReporteInventarioDto, payload);
    // Validamos y obtenemos los errores.
    const errors = await validate(dto);
    // Debe haber al menos dos errores: uno por scopeId vacío y otro por formato inválido.
    expect(errors.length).toBeGreaterThanOrEqual(2);
    // Obtenemos las propiedades que fallaron para hacer asserts claros.
    const propsWithErrors = errors.map((e) => e.property);
    expect(propsWithErrors).toContain('scopeId');
    expect(propsWithErrors).toContain('formato');
  });
});

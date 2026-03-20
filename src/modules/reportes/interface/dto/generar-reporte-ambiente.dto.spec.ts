import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  GenerarReporteAmbienteDto,
  ReporteAmbienteFormato,
} from './generar-reporte-ambiente.dto';

describe('GenerarReporteAmbienteDto', () => {
  it('acepta un payload valido', async () => {
    const payload = {
      id: 1,
      formato: ReporteAmbienteFormato.PDF,
    };
    const dto = plainToInstance(GenerarReporteAmbienteDto, payload);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rechaza cuando falta el id', async () => {
    const payload = {
      formato: ReporteAmbienteFormato.EXCEL,
    };
    const dto = plainToInstance(GenerarReporteAmbienteDto, payload);
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('id');
  });

  it('rechaza un formato no permitido', async () => {
    const payload = {
      id: 1,
      formato: 'docx',
    };
    const dto = plainToInstance(GenerarReporteAmbienteDto, payload);
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('formato');
  });
});

// Estas pruebas describen cómo debe comportarse el DTO de filtros para listar ambientes, con explicaciones paso a paso.

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ListAmbientesQueryDto } from './list-ambientes-query.dto';

const validateDto = async (payload: Record<string, unknown>) => {
  const dto = plainToInstance(ListAmbientesQueryDto, payload);
  const errors = await validate(dto);
  return errors.map((error) => ({
    property: error.property,
    constraints: error.constraints ?? {},
  }));
};

describe('ListAmbientesQueryDto', () => {
  it('acepta los filtros vacíos aplicando defaults', async () => {
    const errors = await validateDto({});
    expect(errors).toHaveLength(0);
  });

  it('rechaza parámetros fuera de rango', async () => {
    const errors = await validateDto({
      page: 0,
      limit: 100,
      bloqueId: -1,
      facultadId: 0,
      tipoAmbienteId: 0,
      pisoMin: -10,
      pisoMax: 500,
    });
    const properties = errors.map((error) => error.property);
    expect(properties).toEqual(
      expect.arrayContaining([
        'page',
        'limit',
        'bloqueId',
        'facultadId',
        'tipoAmbienteId',
        'pisoMin',
        'pisoMax',
      ]),
    );
  });

  it('convierte strings válidos a booleanos gracias al pipe de transformación', async () => {
    const dto = plainToInstance(ListAmbientesQueryDto, {
      activo: 'true',
      clases: '',
    });
    expect(dto.activo).toBe(true);
    expect(dto.clases).toBe(false);
  });
});

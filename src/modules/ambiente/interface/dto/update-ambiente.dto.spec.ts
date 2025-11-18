// Pruebas del DTO de actualización de ambientes explicadas paso a paso para que cualquiera pueda entenderlas.
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateAmbienteDto } from './update-ambiente.dto';

const validateDto = async (payload: Record<string, unknown>) => {
  const dto = plainToInstance(UpdateAmbienteDto, payload);
  const errors = await validate(dto);
  return errors.map((error) => ({
    property: error.property,
    constraints: error.constraints ?? {},
  }));
};

describe('UpdateAmbienteDto', () => {
  it('acepta un payload parcial con datos válidos', async () => {
    const payload = {
      nombre: 'Aula renovada',
      capacidad: { total: 35, examen: 20 },
      dimension: {
        largo: 9,
        ancho: 4,
        alto: 3,
        unid_med: 'metros',
      },
      clases: false,
    };

    const errors = await validateDto(payload);
    expect(errors).toHaveLength(0);
  });

  it('reporta error cuando los campos no cumplen las reglas', async () => {
    const payload = {
      codigo: '',
      nombre: '',
      capacidad: { total: -1, examen: 10 },
      dimension: { largo: -1, ancho: 4, alto: 3, unid_med: 'yardas' },
      piso: 300,
      tipo_ambiente_id: 0,
      bloque_id: 0,
    };

    const errors = await validateDto(payload);
    const props = errors.map((err) => err.property);
    expect(props).toEqual(
      expect.arrayContaining([
        'codigo',
        'nombre',
        'capacidad',
        'dimension',
        'piso',
        'tipo_ambiente_id',
        'bloque_id',
      ]),
    );
  });
});

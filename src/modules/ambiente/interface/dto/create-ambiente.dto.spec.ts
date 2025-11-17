// Estas pruebas nos permiten describir línea por línea cómo debe comportarse CreateAmbienteDto
// para que cualquier persona, sin importar su experiencia, comprenda qué validaciones aplicamos.

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateAmbienteDto } from './create-ambiente.dto';

// Función auxiliar que ejecuta class-validator y retorna los mensajes de error para facilitar las aserciones.
const validateDto = async (payload: Record<string, unknown>) => {
  const dto = plainToInstance(CreateAmbienteDto, payload);
  const errors = await validate(dto);
  return errors.map((error) => ({
    property: error.property,
    constraints: error.constraints ?? {},
  }));
};

describe('CreateAmbienteDto', () => {
  it('valida exitosamente cuando los datos cumplen las reglas', async () => {
    const payload = {
      nombre: 'Laboratorio de Software',
      nombre_corto: 'Lab soft',
      codigo: 'LAB-SOFT-01',
      piso: 2,
      capacidad: { total: 40, examen: 25 },
      dimension: {
        largo: 8.5,
        ancho: 6.1,
        alto: 3.2,
        unid_med: 'metros',
      },
      clases: true,
      tipo_ambiente_id: 5,
      bloque_id: 8,
    };

    const errors = await validateDto(payload);
    expect(errors).toHaveLength(0);
  });

  it('reporta error cuando falta un campo obligatorio', async () => {
    const payload = {
      nombre_corto: 'Lab soft',
      codigo: 'LAB-SOFT-01',
    };

    const errors = await validateDto(payload);
    const fields = errors.map((error) => error.property);
    expect(fields).toContain('nombre');
    expect(fields).toContain('piso');
    expect(fields).toContain('clases');
    expect(fields).toContain('tipo_ambiente_id');
    expect(fields).toContain('bloque_id');
  });

  it('exige que capacidad tenga total y examen mayores o iguales a 0', async () => {
    const payload = {
      nombre: 'Laboratorio',
      codigo: 'LAB-SOFT-01',
      piso: 1,
      clases: true,
      tipo_ambiente_id: 5,
      bloque_id: 8,
      capacidad: { total: -1, examen: 10 },
      dimension: {
        largo: 8,
        ancho: 5,
        alto: 3,
        unid_med: 'metros',
      },
    };

    const errors = await validateDto(payload);
    const capacidadErrors = errors.find(
      (error) => error.property === 'capacidad',
    );
    expect(capacidadErrors).toBeDefined();
  });

  it('exige que dimension tenga unidades permitidas', async () => {
    const payload = {
      nombre: 'Laboratorio',
      codigo: 'LAB-SOFT-01',
      piso: 1,
      clases: true,
      tipo_ambiente_id: 5,
      bloque_id: 8,
      dimension: {
        largo: 8,
        ancho: 5,
        alto: 3,
        unid_med: 'yardas',
      },
    };

    const errors = await validateDto(payload);
    const dimensionErrors = errors.find(
      (error) => error.property === 'dimension',
    );
    expect(dimensionErrors).toBeDefined();
  });

  it('acepta omitir campos opcionales como nombre_corto, capacidad y dimension', async () => {
    const payload = {
      nombre: 'Laboratorio',
      codigo: 'LAB-SOFT-01',
      piso: 1,
      clases: true,
      tipo_ambiente_id: 5,
      bloque_id: 8,
    };

    const errors = await validateDto(payload);
    expect(errors).toHaveLength(0);
  });
});

// Estas pruebas validan el DTO de actualización con comentarios para principiantes.
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateTipoAmbienteDto } from './update-tipo-ambiente.dto';

const validateInput = async (input: Record<string, unknown>) => {
  const dto = plainToInstance(UpdateTipoAmbienteDto, input);
  const errors = await validate(dto);
  return errors.flatMap((error) => Object.values(error.constraints ?? {}));
};

describe('UpdateTipoAmbienteDto', () => {
  it('acepta payload con cualquier campo opcional válido', async () => {
    const errors = await validateInput({
      nombre: 'Laboratorio',
      descripcion: 'Espacio para prácticas científicas',
      descripcion_corta: 'Lab',
      activo: false,
    });
    expect(errors).toHaveLength(0);
  });

  it('permite enviar payload vacío (la lógica de negocio decide)', async () => {
    const errors = await validateInput({});
    expect(errors).toHaveLength(0);
  });

  it('rechaza un nombre vacío', async () => {
    const errors = await validateInput({ nombre: '' });
    expect(errors).toContain('El nombre no puede estar vacío');
  });

  it('rechaza un nombre que supera 64 caracteres', async () => {
    const errors = await validateInput({ nombre: 'x'.repeat(65) });
    expect(errors).toContain('El nombre no debe exceder los 64 caracteres');
  });

  it('rechaza una descripción vacía', async () => {
    const errors = await validateInput({ descripcion: '' });
    expect(errors).toContain('La descripción no puede estar vacía');
  });

  it('rechaza una descripción mayor a 256 caracteres', async () => {
    const errors = await validateInput({ descripcion: 'x'.repeat(257) });
    expect(errors).toContain(
      'La descripción no debe exceder los 256 caracteres',
    );
  });

  it('rechaza una descripción corta mayor a 32 caracteres', async () => {
    const errors = await validateInput({ descripcion_corta: 'x'.repeat(33) });
    expect(errors).toContain(
      'La descripción corta no debe exceder los 32 caracteres',
    );
  });
});

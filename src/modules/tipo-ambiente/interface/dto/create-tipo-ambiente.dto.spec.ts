// Estas pruebas validan el comportamiento de CreateTipoAmbienteDto con comentarios pedagógicos por cada paso.
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
// Importamos el DTO (aún por implementar) para describir sus reglas de validación.
import { CreateTipoAmbienteDto } from './create-tipo-ambiente.dto';

// Función auxiliar que recibe un payload, lo transforma en DTO y devuelve los mensajes de error.
const validateInput = async (input: Record<string, unknown>) => {
  // Transformamos el objeto plano en una instancia del DTO para que class-validator aplique los decoradores.
  const dto = plainToInstance(CreateTipoAmbienteDto, input);
  // Ejecutamos las validaciones y obtenemos los detalles de cada campo.
  const errors = await validate(dto);
  // Convertimos los errores en un arreglo de textos legibles para facilitar las aserciones.
  return errors.flatMap((error) => Object.values(error.constraints ?? {}));
};

// Agrupamos las pruebas del DTO para entender su comportamiento completo.
describe('CreateTipoAmbienteDto', () => {
  // Camino feliz: datos correctos deben ser aceptados.
  it('acepta un payload válido con nombre, descripción y descripción corta opcional', async () => {
    // Construimos un payload con todos los campos válidos.
    const payload = {
      nombre: 'Laboratorio de física',
      descripcion: 'Espacio equipado para experimentos de física',
      descripcion_corta: 'Lab física',
    };
    // Validamos y esperamos cero errores.
    const errors = await validateInput(payload);
    expect(errors).toHaveLength(0);
  });

  // Validamos que el nombre sea obligatorio y no vacío.
  it('rechaza cuando el nombre está vacío', async () => {
    const payload = {
      nombre: '',
      descripcion: 'Descripcion válida',
    };
    const errors = await validateInput(payload);
    expect(errors).toContain('El nombre no puede estar vacío');
  });

  // Revisamos la longitud máxima del nombre (64 caracteres).
  it('rechaza nombres que exceden 64 caracteres', async () => {
    const payload = {
      nombre: 'x'.repeat(65),
      descripcion: 'Descripcion válida',
    };
    const errors = await validateInput(payload);
    expect(errors).toContain('El nombre no debe exceder los 64 caracteres');
  });

  // La descripción es obligatoria y no puede estar vacía.
  it('rechaza cuando la descripción está vacía', async () => {
    const payload = {
      nombre: 'Laboratorio de física',
      descripcion: '',
    };
    const errors = await validateInput(payload);
    expect(errors).toContain('La descripción no puede estar vacía');
  });

  // La descripción tiene un máximo de 256 caracteres.
  it('rechaza descripciones mayores a 256 caracteres', async () => {
    const payload = {
      nombre: 'Laboratorio de física',
      descripcion: 'x'.repeat(257),
    };
    const errors = await validateInput(payload);
    expect(errors).toContain(
      'La descripción no debe exceder los 256 caracteres',
    );
  });

  // descripcion_corta es opcional, pero si viene debe respetar 32 caracteres máximo.
  it('rechaza descripciones cortas con más de 32 caracteres', async () => {
    const payload = {
      nombre: 'Laboratorio de física',
      descripcion: 'Descripcion válida',
      descripcion_corta: 'x'.repeat(33),
    };
    const errors = await validateInput(payload);
    expect(errors).toContain(
      'La descripción corta no debe exceder los 32 caracteres',
    );
  });
});

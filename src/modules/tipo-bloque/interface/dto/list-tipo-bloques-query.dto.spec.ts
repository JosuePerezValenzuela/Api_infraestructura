// Estas pruebas aseguran que ListTipoBloquesQueryDto valide los filtros de consulta correctamente.
// Cada linea incluye comentarios sencillos para que cualquier persona entienda lo que sucede.

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ListTipoBloquesQueryDto } from './list-tipo-bloques-query.dto';

const runValidation = async (input: Record<string, unknown>) => {
  const dto = plainToInstance(ListTipoBloquesQueryDto, input);
  const errors = await validate(dto);
  return errors.flatMap((error) => Object.values(error.constraints ?? {}));
};

describe('ListTipoBloquesQueryDto', () => {
  it('acepta filtros validos', async () => {
    const errors = await runValidation({
      page: 2,
      limit: 5,
      search: 'aulas',
      orderBy: 'creado_en',
      orderDir: 'desc',
    });
    expect(errors).toHaveLength(0);
  });

  it('rechaza page menor a 1', async () => {
    const errors = await runValidation({ page: 0 });
    expect(errors).toContain('La pagina debe ser un numero mayor o igual a 1');
  });

  it('rechaza limit menor a 1', async () => {
    const errors = await runValidation({ limit: 0 });
    expect(errors).toContain('El limite debe ser un numero mayor o igual a 1');
  });

  it('rechaza orderBy fuera de la lista permitida', async () => {
    const errors = await runValidation({ orderBy: 'codigo' });
    expect(errors).toContain(
      'Solo se puede ordenar por nombre, descripcion o creado_en',
    );
  });

  it('rechaza orderDir fuera de asc o desc', async () => {
    const errors = await runValidation({ orderDir: 'random' });
    expect(errors).toContain('La direccion de orden debe ser asc o desc');
  });
});

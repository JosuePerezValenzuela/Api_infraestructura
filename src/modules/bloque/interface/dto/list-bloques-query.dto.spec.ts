// En este archivo definimos las pruebas del DTO ListBloquesQueryDto y explicamos cada paso para que incluso quien no programa pueda seguirlo.
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ListBloquesQueryDto } from './list-bloques-query.dto';

// Función auxiliar que convierte un payload plano al DTO y devuelve los mensajes de error.
const validateInput = async (input: Record<string, unknown>) => {
  const dto = plainToInstance(ListBloquesQueryDto, input);
  const errors = await validate(dto);
  return errors.flatMap((error) => Object.values(error.constraints ?? {}));
};

describe('ListBloquesQueryDto', () => {
  it('acepta un conjunto válido de filtros y paginación', async () => {
    const query = {
      page: 2,
      limit: 10,
      search: 'central',
      facultadId: 5,
      tipoBloqueId: 3,
      activo: true,
      pisosMin: 2,
      pisosMax: 6,
      orderBy: 'codigo',
      orderDir: 'desc',
    };
    const errors = await validateInput(query);
    expect(errors).toHaveLength(0);
  });

  it('requiere que la pagina sea un entero mayor o igual a 1', async () => {
    const errors = await validateInput({ page: 0 });
    expect(errors).toContain('La pagina debe ser un numero mayor o igual a 1');
  });

  it('limita el parametro limit a un rango entre 1 y 50', async () => {
    const errors = await validateInput({ limit: 51 });
    expect(errors).toContain(
      'El limite debe ser un numero entre 1 y 50 registros por pagina',
    );
  });

  it('valida que facultadId sea un entero positivo', async () => {
    const errors = await validateInput({ facultadId: -1 });
    expect(errors).toContain(
      'La facultadId debe ser un numero entero positivo',
    );
  });

  it('valida que tipoBloqueId sea un entero positivo', async () => {
    const errors = await validateInput({ tipoBloqueId: 0 });
    expect(errors).toContain(
      'El tipoBloqueId debe ser un numero entero positivo',
    );
  });

  it('exige que pisosMin sea un entero entre 1 y 99', async () => {
    const errors = await validateInput({ pisosMin: 0 });
    expect(errors).toContain(
      'El pisosMin debe ser un entero entre 1 y 99 pisos',
    );
  });

  it('exige que pisosMax sea un entero entre 1 y 99', async () => {
    const errors = await validateInput({ pisosMax: 120 });
    expect(errors).toContain(
      'El pisosMax debe ser un entero entre 1 y 99 pisos',
    );
  });

  it('valida que orderBy solo acepte los campos permitidos', async () => {
    const errors = await validateInput({ orderBy: 'otro' });
    expect(errors).toContain(
      'Solo puedes ordenar por codigo, nombre, pisos, activo o creado_en',
    );
  });

  it('valida que orderDir solo acepte asc o desc', async () => {
    const errors = await validateInput({ orderDir: 'up' });
    expect(errors).toContain('La direccion de orden solo puede ser asc o desc');
  });

  it('acepta el campo activo como booleano', async () => {
    const errors = await validateInput({ activo: 'true' });
    expect(errors).toContain('El activo debe ser un valor booleano');
  });
});

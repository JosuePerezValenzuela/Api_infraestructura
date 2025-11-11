// Esta suite explica cómo debe validar el DTO de listados de tipos de ambiente.
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ListTipoAmbientesQueryDto } from './list-tipo-ambientes-query.dto';

// Helper que transforma un payload en DTO y devuelve los mensajes de error.
const validateInput = async (input: Record<string, unknown>) => {
  const dto = plainToInstance(ListTipoAmbientesQueryDto, input);
  const errors = await validate(dto);
  return errors.flatMap((error) => Object.values(error.constraints ?? {}));
};

describe('ListTipoAmbientesQueryDto', () => {
  it('acepta los valores por defecto cuando no se envían parámetros', async () => {
    const errors = await validateInput({});
    expect(errors).toHaveLength(0);
  });

  it('permite definir page, limit, search, orderBy y orderDir válidos', async () => {
    const errors = await validateInput({
      page: 2,
      limit: 15,
      search: 'laboratorio',
      orderBy: 'creado_en',
      orderDir: 'desc',
    });
    expect(errors).toHaveLength(0);
  });

  it('rechaza page menores a 1', async () => {
    const errors = await validateInput({ page: 0 });
    expect(errors).toContain('La página debe ser un entero mayor o igual a 1');
  });

  it('rechaza limit mayores a 50', async () => {
    const errors = await validateInput({ limit: 200 });
    expect(errors).toContain('El límite máximo permitido es 50 registros');
  });

  it('rechaza orderBy que no estén permitidos', async () => {
    const errors = await validateInput({ orderBy: 'invalido' });
    expect(errors).toContain('Solo puedes ordenar por nombre o creado_en');
  });

  it('rechaza orderDir diferentes a asc o desc', async () => {
    const errors = await validateInput({ orderDir: 'sideways' });
    expect(errors).toContain('Solo se aceptan las direcciones asc o desc');
  });
});

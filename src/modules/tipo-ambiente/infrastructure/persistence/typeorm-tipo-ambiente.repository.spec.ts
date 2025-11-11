// En estas pruebas describimos el comportamiento del repositorio TypeormTipoAmbienteRepository paso a paso.
import { DataSource, QueryFailedError } from 'typeorm';
import { ConflictException } from '@nestjs/common';
import { TypeormTipoAmbienteRepository } from './typeorm-tipo-ambiente.repository';

// Definimos una versión simplificada del DataSource que usaremos como doble de pruebas.
type FakeDataSource = {
  // query será un mock controlado con Jest para inspeccionar SQL y parámetros enviados.
  query: jest.Mock;
};

describe('TypeormTipoAmbienteRepository', () => {
  // Helper que crea el repositorio con un DataSource falso por cada escenario.
  const buildRepository = () => {
    const dataSource: FakeDataSource = {
      query: jest.fn(),
    };
    const repository = new TypeormTipoAmbienteRepository(
      dataSource as unknown as DataSource,
    );
    return { repository, dataSource };
  };

  // Verificamos que create inserta el registro con SQL crudo y retorna el id generado.
  it('crea un tipo de ambiente y devuelve el id generado', async () => {
    const { repository, dataSource } = buildRepository();
    // Simulamos que la base devuelve una fila con el id autogenerado.
    dataSource.query.mockResolvedValue([{ id: 21 }]);

    const result = await repository.create({
      nombre: 'Laboratorio Clínico',
      descripcion: 'Espacio equipado para análisis clínicos',
      descripcion_corta: 'Lab clínico',
      activo: true,
    });

    const [rawSql, params] = dataSource.query.mock.calls[0];
    const sql = rawSql.replace(/\s+/g, ' ').trim();

    expect(sql).toContain(
      'INSERT INTO infraestructura.tipo_ambientes (nombre, descripcion, descripcion_corta, activo)',
    );
    expect(params).toEqual([
      'Laboratorio Clínico',
      'Espacio equipado para análisis clínicos',
      'Lab clínico',
      true,
    ]);
    expect(result).toEqual({ id: 21 });
  });

  // Validamos que se traduzca la violación de unicidad (código 23505) en ConflictException.
  it('lanza ConflictException cuando la BD reporta nombre duplicado', async () => {
    const { repository, dataSource } = buildRepository();
    const driverError = { code: '23505' };
    const queryError = new QueryFailedError('INSERT', [], driverError);
    dataSource.query.mockRejectedValue(queryError);

    await expect(
      repository.create({
        nombre: 'Laboratorio Clínico',
        descripcion: 'Espacio equipado para análisis clínicos',
        descripcion_corta: 'Lab clínico',
        activo: true,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  // Comprobamos que isNameTaken devuelve true cuando encuentra registros.
  it('indica que un nombre está tomado cuando la consulta retorna filas', async () => {
    const { repository, dataSource } = buildRepository();
    dataSource.query.mockResolvedValue([{ existe: 1 }]);

    const taken = await repository.isNameTaken('Laboratorio Clínico');

    const [rawSql, params] = dataSource.query.mock.calls[0];
    const sql = rawSql.replace(/\s+/g, ' ').trim();
    expect(sql).toContain(
      'SELECT 1 AS existe FROM infraestructura.tipo_ambientes WHERE nombre = $1',
    );
    expect(params).toEqual(['Laboratorio Clínico']);
    expect(taken).toBe(true);
  });

  // Comprobamos que isNameTaken devuelve false cuando no encuentra coincidencias.
  it('indica que un nombre está libre cuando la consulta no devuelve filas', async () => {
    const { repository, dataSource } = buildRepository();
    dataSource.query.mockResolvedValue([]);

    const taken = await repository.isNameTaken('Laboratorio Clínico');

    const [rawSql] = dataSource.query.mock.calls[0];
    const sql = rawSql.replace(/\s+/g, ' ').trim();
    expect(sql).toContain(
      'SELECT 1 AS existe FROM infraestructura.tipo_ambientes WHERE nombre = $1',
    );
    expect(taken).toBe(false);
  });
});

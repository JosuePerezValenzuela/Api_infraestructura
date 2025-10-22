// Este archivo contiene las pruebas del repositorio TypeormTipoBloqueRepository con explicaciones paso a paso.
// Importamos DataSource y QueryFailedError de TypeORM para simular el comportamiento de la base de datos.
import { DataSource, QueryFailedError } from 'typeorm';
// Importamos ConflictException para comprobar la traduccion del error de unicidad.
import { ConflictException } from '@nestjs/common';
// Importamos la clase a probar (todavia no implementada) para describir el comportamiento esperado.
import { TypeormTipoBloqueRepository } from './typeorm-tipo-bloque.repository';

// Definimos un tipo auxiliar que representa el DataSource falso con el metodo query simulado.
type FakeDataSource = {
  // query es un mock de Jest que permitira verificar la consulta SQL y los parametros enviados.
  query: jest.Mock;
};

// Agrupamos todas las pruebas del repositorio dentro de describe para mantener orden.
describe('TypeormTipoBloqueRepository', () => {
  // Funcion auxiliar que crea el repositorio bajo prueba con un DataSource falso configurable.
  const buildRepository = () => {
    // Creamos un objeto con un metodo query simulado que podremos controlar en cada prueba.
    const dataSource: FakeDataSource = {
      query: jest.fn(),
    };
    // Instanciamos el repositorio pasando el DataSource falso.
    const repository = new TypeormTipoBloqueRepository(
      dataSource as unknown as DataSource,
    );
    // Retornamos ambas piezas para que las pruebas puedan inspeccionarlas.
    return { repository, dataSource };
  };

  // Probamos que create ejecute un INSERT y retorne el id devuelto por la base de datos.
  it('crea un tipo de bloque con SQL crudo y retorna el id', async () => {
    // Construimos el repositorio con su DataSource falso.
    const { repository, dataSource } = buildRepository();
    // Simulamos que la base de datos responde con un registro que contiene el id generado.
    dataSource.query.mockResolvedValue([{ id: 15 }]);
    // Ejecutamos la funcion create con datos ya validados por el caso de uso.
    const result = await repository.create({
      nombre: 'Laboratorios',
      descripcion: 'Salas con equipamiento especializado',
      activo: true,
    });
    // Recuperamos la primera llamada que recibio el metodo query para verificar la sentencia SQL.
    const [sql, params] = dataSource.query.mock.calls[0];
    // Comprobamos que la sentencia contiene el INSERT esperado sobre la tabla infraestructura.tipo_bloques.
    expect(sql).toContain(
      'INSERT INTO infraestructura.tipo_bloques (nombre, descripcion, activo)',
    );
    // Verificamos que los parametros enviados coinciden con el objeto de entrada.
    expect(params).toEqual([
      'Laboratorios',
      'Salas con equipamiento especializado',
      true,
    ]);
    // Confirmamos que el repositorio devolvio el id convertido a numero.
    expect(result).toEqual({ id: 15 });
  });

  // Probamos que create transforme el error 23505 (unicidad) en ConflictException.
  it('lanza ConflictException cuando el nombre ya existe en la base de datos', async () => {
    // Construimos el repositorio con el DataSource falso.
    const { repository, dataSource } = buildRepository();
    // Creamos un error de TypeORM que simula la violacion de unicidad con codigo 23505.
    const driverError = { code: '23505' };
    const queryError = new QueryFailedError('INSERT', [], driverError);
    // Configuramos el DataSource para que rechace la consulta con ese error.
    dataSource.query.mockRejectedValue(queryError);
    // Ejecutamos create y esperamos que se traduzca el error a ConflictException.
    await expect(
      repository.create({
        nombre: 'Laboratorios',
        descripcion: 'Salas con equipamiento especializado',
        activo: true,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  // Probamos que isNameTaken devuelva true cuando existe un registro con el mismo nombre.
  it('indica que un nombre esta ocupado cuando la consulta devuelve filas', async () => {
    // Construimos el repositorio con el DataSource falso.
    const { repository, dataSource } = buildRepository();
    // Configuramos la respuesta de la base de datos con un arreglo de filas simulando el hallazgo.
    dataSource.query.mockResolvedValue([{ existe: 1 }]);
    // Ejecutamos isNameTaken con un nombre cualquiera.
    const taken = await repository.isNameTaken('Laboratorios');
    // Verificamos que el metodo haya construido la consulta correcta contra la tabla.
    const [sql, params] = dataSource.query.mock.calls[0];
    // La consulta debe seleccionar desde infraestructura.tipo_bloques comparando por nombre.
    expect(sql).toContain(
      'SELECT 1 AS existe FROM infraestructura.tipo_bloques WHERE nombre = $1',
    );
    // El parametro enviado debe ser el nombre.
    expect(params).toEqual(['Laboratorios']);
    // Confirmamos que el metodo devuelve true porque la fila existe.
    expect(taken).toBe(true);
  });

  // Probamos que isNameTaken devuelva false cuando no se encuentran filas coincidentes.
  it('indica que un nombre esta libre cuando la consulta no retorna filas', async () => {
    // Construimos el repositorio con el DataSource falso.
    const { repository, dataSource } = buildRepository();
    // Simulamos que la base de datos devuelve un arreglo vacio.
    dataSource.query.mockResolvedValue([]);
    // Ejecutamos la verificacion para un nombre cualquiera.
    const taken = await repository.isNameTaken('Laboratorios');
    // Verificamos que el metodo use el mismo SQL que en el caso anterior.
    const [sql] = dataSource.query.mock.calls[0];
    expect(sql).toContain(
      'SELECT 1 AS existe FROM infraestructura.tipo_bloques WHERE nombre = $1',
    );
    // Confirmamos que la funcion retorna false al no recibir filas.
    expect(taken).toBe(false);
  });
});

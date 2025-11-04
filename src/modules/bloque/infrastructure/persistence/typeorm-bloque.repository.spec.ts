// En este archivo definimos las pruebas del repositorio TypeormBloqueRepository.
// Cada línea está comentada para que alguien sin experiencia aprenda cómo se verifica una capa de infraestructura.
import { ConflictException } from '@nestjs/common';
// Importamos QueryFailedError para simular errores que provienen directamente de PostgreSQL.
import { QueryFailedError } from 'typeorm';
// Importamos la clase que vamos a probar (se implementará después siguiendo estas expectativas).
import { TypeormBloqueRepository } from './typeorm-bloque.repository';

// Creamos una función auxiliar que produce una DataSource falsa con su método query reemplazado por Jest.
const createFakeDataSource = () => {
  return {
    // Jest.fn nos permite espiar las llamadas y también controlar qué resultado devuelve la base de datos simulada.
    query: jest.fn(),
  };
};

// Agrupamos las pruebas dentro de describe para mantener organizado el comportamiento del repositorio.
describe('TypeormBloqueRepository', () => {
  // Este test se centra en el método create y en cómo arma la consulta SQL.
  it('inserta un bloque y devuelve el id generado', async () => {
    // Construimos nuestra DataSource falsa para no tocar una base real.
    const dataSource = createFakeDataSource();
    // Configuramos el mock para devolver un arreglo con el id que PostgreSQL regresaría tras el INSERT.
    dataSource.query.mockResolvedValueOnce([{ id: '42' }]);
    // Instanciamos el repositorio inyectando la DataSource simulada.
    const repository = new TypeormBloqueRepository(
      dataSource as unknown as any,
    );
    // Definimos el comando que el repositorio recibirá desde el caso de uso.
    const command = {
      codigo: 'BLOQUE-101',
      nombre: 'Bloque Central',
      nombre_corto: 'Central',
      pointLiteral: '-66.1568,-17.3937',
      pisos: 4,
      activo: true,
      facultad_id: 1,
      tipo_bloque_id: 2,
    };
    // Ejecutamos el método create con los datos preparados.
    const result = await repository.create(command);
    // Comprobamos que el método query fue llamado una sola vez.
    expect(dataSource.query).toHaveBeenCalledTimes(1);
    // Extraemos los argumentos con los que se invocó a query para inspeccionar el SQL generado.
    const [sql, params] = dataSource.query.mock.calls[0];
    // Validamos que el SQL contenga el INSERT con la tabla y columnas correctas.
    expect(sql).toContain(
      'INSERT INTO infraestructura.bloques (codigo, nombre, nombre_corto, pisos, coordenadas, activo, facultad_id, tipo_bloque_id)',
    );
    // Confirmamos que los parámetros enviados respetan el orden esperado por la consulta.
    expect(params).toEqual([
      'BLOQUE-101',
      'Bloque Central',
      'Central',
      4,
      '-66.1568,-17.3937',
      true,
      1,
      2,
    ]);
    // Finalmente verificamos que el método devuelva el id transformado a número.
    expect(result).toEqual({ id: 42 });
  });

  // En este test verificamos que el repositorio capture errores de duplicidad y los transforme en ConflictException.
  it('lanza ConflictException cuando postgres reporta codigo duplicado', async () => {
    const dataSource = createFakeDataSource();
    // Simulamos un QueryFailedError con el código 23505 (colisión de valor único en PostgreSQL).
    const driverError = { code: '23505' };
    const queryError = new QueryFailedError(
      'INSERT',
      [],
      driverError as unknown as Error,
    );
    dataSource.query.mockRejectedValueOnce(queryError);
    const repository = new TypeormBloqueRepository(
      dataSource as unknown as any,
    );
    const command = {
      codigo: 'BLOQUE-101',
      nombre: 'Bloque Central',
      nombre_corto: 'Central',
      pointLiteral: '-66.1568,-17.3937',
      pisos: 4,
      activo: true,
      facultad_id: 1,
      tipo_bloque_id: 2,
    };
    // Esperamos que el método rechace con ConflictException cuando recibe el error de Postgres.
    await expect(repository.create(command)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  // En este tercer test cubrimos el método isCodeTaken, verificando que devuelva true o false según la consulta.
  it('confirma si un codigo ya existe en la base de datos', async () => {
    const dataSource = createFakeDataSource();
    // Primero el mock devolverá un registro indicando que el código existe.
    dataSource.query
      .mockResolvedValueOnce([{ existe: 1 }])
      // Luego devolverá un arreglo vacío para simular que el código no está registrado.
      .mockResolvedValueOnce([]);
    const repository = new TypeormBloqueRepository(
      dataSource as unknown as any,
    );
    // Ejecutamos la primera llamada donde esperamos true.
    const firstCheck = await repository.isCodeTaken('BLOQUE-101');
    // Ejecutamos la segunda llamada donde esperamos false.
    const secondCheck = await repository.isCodeTaken('BLOQUE-999');
    // Validamos ambos resultados.
    expect(firstCheck).toBe(true);
    expect(secondCheck).toBe(false);
    // Revisamos que la consulta estuviera filtrando por el código recibido.
    expect(dataSource.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('FROM infraestructura.bloques'),
      ['BLOQUE-101'],
    );
  });
});

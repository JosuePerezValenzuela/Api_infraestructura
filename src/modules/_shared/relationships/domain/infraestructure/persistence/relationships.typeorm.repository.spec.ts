// Esta prueba valida la eliminación en cascada de campus y enseña cada paso.

import type { DataSource, QueryRunner } from 'typeorm'; // Importamos los tipos de TypeORM para documentar qué simulamos.
import { TypeormRelationshipRepository } from './relationships.typeorm.repository'; // Importamos el repositorio que queremos probar.

// Declaramos un grupo de pruebas enfocado en deleteCampusCascade con un nombre descriptivo.
describe('TypeormRelationshipRepository.deleteCampusCascade', () => {
  // Definimos el identificador de campus que usaremos en los distintos escenarios de prueba.
  const campusId = 42; // Usamos 42 como ejemplo para mantener la explicación simple.

  // Declaramos variables que configuraremos antes de cada prueba.
  let queryRunner: jest.Mocked<QueryRunner>; // Guardará la versión falsa del QueryRunner de TypeORM.
  let dataSource: { createQueryRunner: jest.Mock }; // Representará la fuente de datos que entrega el QueryRunner falso.
  let repository: TypeormRelationshipRepository; // Instancia del repositorio que vamos a ejercer en las pruebas.

  // beforeEach se ejecuta antes de cada prueba individual para que todas partan desde el mismo estado.
  beforeEach(() => {
    // Creamos el QueryRunner falso definiendo cada uno de los métodos que el repositorio usa internamente.
    queryRunner = {
      connect: jest.fn().mockResolvedValue(undefined), // Simulamos la conexión al motor.
      startTransaction: jest.fn().mockResolvedValue(undefined), // Simulamos el inicio de una transacción.
      commitTransaction: jest.fn().mockResolvedValue(undefined), // Simulamos el commit exitoso.
      rollbackTransaction: jest.fn().mockResolvedValue(undefined), // Simulamos el rollback ante errores.
      release: jest.fn().mockResolvedValue(undefined), // Simulamos la liberación de la conexión.
      query: jest.fn(), // Permitimos registrar cada consulta SQL emitida.
      manager: undefined, // Aportamos el resto de propiedades requeridas aunque no las usemos.
      data: undefined,
      isReleased: false,
      isTransactionActive: false,
      isTransactionActiveRecursive: false,
      isTransactionRunning: false,
      isClosed: false,
      connection: undefined as unknown as any,
      database: undefined,
      loadedTables: [],
      loadedSchemas: [],
      instance: undefined,
      queryRunner: undefined as unknown as any,
      driver: undefined as unknown as any,
      // TypeORM espera propiedades adicionales, pero no las utilizaremos en las pruebas.
    } as unknown as jest.Mocked<QueryRunner>; // Hacemos un cast para indicar a TypeScript que basta con lo que definimos.

    // Creamos un objeto que imita al DataSource entregando siempre nuestro QueryRunner falso.
    dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner), // Cada vez que se solicite un QueryRunner devolvemos el mismo.
    };

    // Instanciamos el repositorio real pasando el DataSource falso para controlar su comportamiento.
    repository = new TypeormRelationshipRepository(
      dataSource as unknown as DataSource,
    );
  });

  // Esta prueba representa el escenario feliz: borrar un campus con dependencias.
  it('elimina un campus y todas sus dependencias en el orden correcto', async () => {
    // Configuramos la respuesta de la primera consulta: obtener facultades del campus.
    queryRunner.query.mockResolvedValueOnce([{ id: 100 }, { id: 200 }]);
    // Configuramos la respuesta de la segunda consulta: obtener bloques de esas facultades.
    queryRunner.query.mockResolvedValueOnce([{ id: 300 }, { id: 400 }]);
    // Configuramos la tercera consulta: eliminación de ambientes que pertenecen a los bloques.
    queryRunner.query.mockResolvedValueOnce([]);
    // Configuramos la cuarta consulta: eliminación de los bloques.
    queryRunner.query.mockResolvedValueOnce([]);
    // Configuramos la quinta consulta: eliminación de las facultades.
    queryRunner.query.mockResolvedValueOnce([]);
    // Configuramos la sexta consulta: eliminación final del campus.
    queryRunner.query.mockResolvedValueOnce([]);

    // Ejecutamos la funcionalidad que queremos validar. Esta línea fallará ahora porque el método aún no existe.
    await (repository as any).deleteCampusCascade(campusId);

    // Verificamos que la transacción inició una sola vez.
    expect(queryRunner.startTransaction).toHaveBeenCalledTimes(1);
    // Confirmamos que la primera consulta busca las facultades del campus recibido.
    expect(queryRunner.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('FROM infraestructura.facultades'),
      [campusId],
    );
    // Confirmamos que la segunda consulta recupere los bloques asociados.
    expect(queryRunner.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('FROM infraestructura.bloques'),
      [[100, 200]],
    );
    // Revisamos que la tercera consulta elimine los ambientes por medio de los bloques.
    expect(queryRunner.query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('DELETE FROM infraestructura.ambientes'),
      [[300, 400]],
    );
    // Revisamos que la cuarta consulta elimine los bloques.
    expect(queryRunner.query).toHaveBeenNthCalledWith(
      4,
      expect.stringContaining('DELETE FROM infraestructura.bloques'),
      [[300, 400]],
    );
    // Revisamos que la quinta consulta elimine las facultades.
    expect(queryRunner.query).toHaveBeenNthCalledWith(
      5,
      expect.stringContaining('DELETE FROM infraestructura.facultades'),
      [[100, 200]],
    );
    // Finalmente verificamos que se elimine el registro principal del campus.
    expect(queryRunner.query).toHaveBeenNthCalledWith(
      6,
      expect.stringContaining('DELETE FROM infraestructura.campus'),
      [campusId],
    );
    // Confirmamos que la transacción finalizó correctamente.
    expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
  });

  // Esta prueba asegura que cuando el campus no tiene dependencias, solo se elimina el campus.
  it('elimina únicamente el campus cuando no existen dependencias registradas', async () => {
    // Configuramos la primera consulta para indicar que no hay facultades asociadas.
    queryRunner.query.mockResolvedValueOnce([]);
    // Configuramos la segunda consulta para la eliminación del campus en sí.
    queryRunner.query.mockResolvedValueOnce([]);

    // Ejecutamos la función bajo prueba, lo que evidenciará la ausencia del método.
    await (repository as any).deleteCampusCascade(campusId);

    // Verificamos que la primera consulta consultó las facultades.
    expect(queryRunner.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('FROM infraestructura.facultades'),
      [campusId],
    );
    // Confirmamos que la segunda consulta borró directamente el campus al no haber dependencias.
    expect(queryRunner.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('DELETE FROM infraestructura.campus'),
      [campusId],
    );
    // Verificamos que no se hayan hecho más consultas innecesarias.
    expect(queryRunner.query).toHaveBeenCalledTimes(2);
  });

  // Esta prueba comprueba que ante un error interno se haga rollback y se propague la excepción.
  it('realiza rollback y propaga el error cuando alguna consulta falla', async () => {
    // Hacemos que la primera consulta lance un error simulando un problema en la base de datos.
    const fakeError = new Error('Fallo en la base de datos'); // Creamos un error de ejemplo.
    queryRunner.query.mockRejectedValueOnce(fakeError); // La consulta devolverá esta falla.

    // Ejecutamos la función y aseguramos que el error se propaga, demostrando el fallo actual.
    await expect(
      (repository as any).deleteCampusCascade(campusId),
    ).rejects.toThrow(fakeError);

    // Confirmamos que se inició la transacción antes de fallar.
    expect(queryRunner.startTransaction).toHaveBeenCalledTimes(1);
    // Verificamos que se intentó revertir la transacción al detectar el error.
    expect(queryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
    // Confirmamos que siempre se libera el QueryRunner aunque ocurra el error.
    expect(queryRunner.release).toHaveBeenCalledTimes(1);
  });
});

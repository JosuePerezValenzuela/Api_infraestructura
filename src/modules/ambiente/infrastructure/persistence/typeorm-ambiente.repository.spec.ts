// Este archivo explica cada prueba del repositorio TypeormAmbienteRepository para guiar a cualquiera que quiera entender la capa de infraestructura.
// Vamos a validar que las consultas se construyan correctamente y que los errores se transformen en las excepciones de negocio esperadas.

import { ConflictException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { TypeormAmbienteRepository } from './typeorm-ambiente.repository';
import { CreateAmbienteCommand } from '../../domain/commands/create-ambiente.command';

// Creamos un DataSource falso con jest para no depender de una base real.
const createFakeDataSource = () => ({
  query: jest.fn(),
});

describe('TypeormAmbienteRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    // Esta prueba cubre el camino feliz: se inserta un ambiente y devolvemos el id.
    it('inserta un ambiente y devuelve su id', async () => {
      const dataSource = createFakeDataSource();
      dataSource.query.mockResolvedValueOnce([{ id: '77' }]);
      const repository = new TypeormAmbienteRepository(
        dataSource as unknown as any,
      );

      const command: CreateAmbienteCommand = {
        nombre: 'Laboratorio de Física',
        nombre_corto: 'Lab Fisica',
        codigo: 'LAB-FIS-01',
        piso: 1,
        capacidad: { total: 40, examen: 25 },
        dimension: {
          largo: 8.5,
          ancho: 5.2,
          alto: 3.1,
          unid_med: 'metros',
        },
        clases: true,
        activo: true,
        tipo_ambiente_id: 3,
        bloque_id: 9,
      };

      const result = await repository.create(command);

      expect(dataSource.query).toHaveBeenCalledTimes(1);
      const [sql, params] = dataSource.query.mock.calls[0];
      const normalizedSql = sql.replace(/\s+/g, ' ').trim();
      expect(normalizedSql).toContain(
        'INSERT INTO infraestructura.ambientes ( nombre, nombre_corto, codigo, piso, capacidad, dimension, clases, activo, tipo_ambiente_id, bloque_id )',
      );
      expect(params).toEqual([
        'Laboratorio de Física',
        'Lab Fisica',
        'LAB-FIS-01',
        1,
        command.capacidad,
        command.dimension,
        true,
        true,
        3,
        9,
      ]);
      expect(result).toEqual({ id: 77 });
    });

    // Aquí verificamos que si Postgres lanza un error por restricción única, lo convertimos en ConflictException para la capa superior.
    it('lanza ConflictException cuando postgres detecta codigo duplicado', async () => {
      const dataSource = createFakeDataSource();
      const driverError = { code: '23505' };
      const queryError = new QueryFailedError(
        'INSERT',
        [],
        driverError as unknown as Error,
      );
      dataSource.query.mockRejectedValueOnce(queryError);
      const repository = new TypeormAmbienteRepository(
        dataSource as unknown as any,
      );

      const command: CreateAmbienteCommand = {
        nombre: 'Laboratorio de Física',
        nombre_corto: 'Lab Fisica',
        codigo: 'LAB-FIS-01',
        piso: 1,
        capacidad: { total: 40, examen: 25 },
        dimension: {
          largo: 8.5,
          ancho: 5.2,
          alto: 3.1,
          unid_med: 'metros',
        },
        clases: true,
        activo: true,
        tipo_ambiente_id: 3,
        bloque_id: 9,
      };

      await expect(repository.create(command)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(dataSource.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('isCodeTaken', () => {
    // Comprobamos que la consulta retorne true cuando exista al menos un registro con el código dado.
    it('devuelve true cuando ya existe un ambiente con el codigo', async () => {
      const dataSource = createFakeDataSource();
      dataSource.query.mockResolvedValueOnce([{ existe: 1 }]);
      const repository = new TypeormAmbienteRepository(
        dataSource as unknown as any,
      );

      const result = await repository.isCodeTaken('LAB-FIS-01');

      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM infraestructura.ambientes'),
        ['LAB-FIS-01'],
      );
      expect(result).toBe(true);
    });

    // También probamos que si la consulta no devuelve filas, el método responde false.
    it('devuelve false cuando no hay coincidencias', async () => {
      const dataSource = createFakeDataSource();
      dataSource.query.mockResolvedValueOnce([]);
      const repository = new TypeormAmbienteRepository(
        dataSource as unknown as any,
      );

      const result = await repository.isCodeTaken('LAB-FIS-01');
      expect(result).toBe(false);
    });
  });
});

// Este archivo explica cada prueba del repositorio TypeormAmbienteRepository para guiar a cualquiera que quiera entender la capa de infraestructura.
// Vamos a validar que las consultas se construyan correctamente y que los errores se transformen en las excepciones de negocio esperadas.

import { ConflictException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { TypeormAmbienteRepository } from './typeorm-ambiente.repository';
import { CreateAmbienteCommand } from '../../domain/commands/create-ambiente.command';
import {
  AmbienteListItem,
  ListAmbientesOptions,
} from '../../domain/ambiente.list.types';

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

  describe('findById', () => {
    it('devuelve el ambiente cuando existe', async () => {
      const dataSource = createFakeDataSource();
      dataSource.query.mockResolvedValueOnce([
        { id: 5, codigo: 'A', nombre: 'Ambiente A' },
      ]);
      const repository = new TypeormAmbienteRepository(
        dataSource as unknown as any,
      );

      const ambiente = await repository.findById(5);
      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM infraestructura.ambientes'),
        [5],
      );
      expect(ambiente?.id).toBe(5);
    });

    it('devuelve null cuando no existe', async () => {
      const dataSource = createFakeDataSource();
      dataSource.query.mockResolvedValueOnce([]);
      const repository = new TypeormAmbienteRepository(
        dataSource as unknown as any,
      );

      const ambiente = await repository.findById(999);
      expect(ambiente).toBeNull();
    });
  });

  describe('deleteAssets', () => {
    it('pone ambiente_id en null para los activos relacionados', async () => {
      const dataSource = createFakeDataSource();
      const repository = new TypeormAmbienteRepository(
        dataSource as unknown as any,
      );

      await repository.deleteAssets(7);

      const [sql, params] = dataSource.query.mock.calls[0];
      expect(sql.replace(/\s+/g, ' ').trim()).toContain(
        'UPDATE infraestructura.activos SET ambiente_id = NULL WHERE ambiente_id = $1',
      );
      expect(params).toEqual([7]);
    });
  });

  describe('delete', () => {
    it('elimina el ambiente y devuelve el id', async () => {
      const dataSource = createFakeDataSource();
      dataSource.query.mockResolvedValueOnce([{ id: 5 }]);
      const repository = new TypeormAmbienteRepository(
        dataSource as unknown as any,
      );

      const result = await repository.delete({ id: 5 });

      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM infraestructura.ambientes'),
        [5],
      );
      expect(result).toEqual({ id: 5 });
    });
  });

  describe('list', () => {
    const createRepository = () => {
      const dataSource = createFakeDataSource();
      const repository = new TypeormAmbienteRepository(
        dataSource as unknown as any,
      );
      return { dataSource, repository };
    };

    it('construye la consulta con joins, filtros y orden dinámico', async () => {
      const { dataSource, repository } = createRepository();
      const fakeRows: AmbienteListItem[] = [
        {
          id: 1,
          codigo: 'AULA-101',
          nombre: 'Aula 101',
          nombre_corto: '101',
          piso: 1,
          capacidad: { total: 40, examen: 30 },
          dimension: {
            largo: 8,
            ancho: 5,
            alto: 3,
            unid_med: 'metros',
          },
          clases: true,
          activo: true,
          creado_en: '2025-11-11T12:00:00.000Z',
          bloque_nombre: 'Bloque Central',
          facultad_nombre: 'Facultad Ingeniería',
          tipo_ambiente_nombre: 'Aula',
        },
      ];

      dataSource.query
        .mockResolvedValueOnce(fakeRows)
        .mockResolvedValueOnce([{ total: 1 }]);

      const options: ListAmbientesOptions = {
        page: 2,
        take: 10,
        search: 'Lab',
        orderBy: 'codigo',
        orderDir: 'desc',
        bloqueId: 5,
        facultadId: 3,
        tipoAmbienteId: 2,
        activo: true,
        clases: true,
        pisoMin: 1,
        pisoMax: 3,
      };

      const result = await repository.list(options);

      const [dataSql, dataParams] = dataSource.query.mock.calls[0];
      const normalizedSql = dataSql.replace(/\s+/g, ' ').trim();
      expect(normalizedSql).toContain('FROM infraestructura.ambientes a');
      expect(normalizedSql).toContain(
        'JOIN infraestructura.bloques b ON b.id = a.bloque_id',
      );
      expect(normalizedSql).toContain(
        'JOIN infraestructura.facultades f ON f.id = b.facultad_id',
      );
      expect(normalizedSql).toContain(
        'JOIN infraestructura.tipo_ambientes ta ON ta.id = a.tipo_ambiente_id',
      );
      expect(normalizedSql).toContain('a.codigo ILIKE $1');
      expect(normalizedSql).toContain('ORDER BY a.codigo DESC');
      expect(dataParams).toEqual([
        '%Lab%',
        '%Lab%',
        '%Lab%',
        5,
        3,
        2,
        true,
        true,
        1,
        3,
        10,
        10,
      ]);

      const [countSql, countParams] = dataSource.query.mock.calls[1];
      expect(countSql).toContain('SELECT COUNT(*)::int AS total');
      expect(countParams).toEqual([
        '%Lab%',
        '%Lab%',
        '%Lab%',
        5,
        3,
        2,
        true,
        true,
        1,
        3,
      ]);

      expect(result.items).toEqual(fakeRows);
      expect(result.meta).toEqual({
        total: 1,
        page: 2,
        take: 10,
        hasNextPage: false,
        hasPreviousPage: true,
      });
    });
  });
});

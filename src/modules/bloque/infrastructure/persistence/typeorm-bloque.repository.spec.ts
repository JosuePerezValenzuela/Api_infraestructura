// En este archivo documentamos paso a paso las pruebas del repositorio TypeormBloqueRepository
// para que cualquier persona que recien empieza pueda entender que debe hacer la capa de infraestructura.

import { ConflictException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { TypeormBloqueRepository } from './typeorm-bloque.repository';
import type { UpdateBloqueCommand } from '../../domain/commands/update-bloque.command';

// Creamos una DataSource falsa para no depender de una base de datos real en los tests.
const createFakeDataSource = () => ({
  query: jest.fn(),
});

describe('TypeormBloqueRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('devuelve un snapshot del bloque con las coordenadas separadas', async () => {
      const dataSource = createFakeDataSource();
      dataSource.query.mockResolvedValueOnce([
        {
          id: 10,
          codigo: 'BLOQUE-10',
          nombre: 'Bloque Central',
          nombre_corto: 'Central',
          pisos: 4,
          activo: true,
          facultad_id: 2,
          tipo_bloque_id: 3,
          lat: -17.39,
          lng: -66.15,
        },
      ]);

      const repository = new TypeormBloqueRepository(
        dataSource as unknown as any,
      );

      const snapshot = await repository.findById(10);

      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM infraestructura.bloques'),
        [10],
      );
      expect(snapshot).toEqual({
        id: 10,
        codigo: 'BLOQUE-10',
        nombre: 'Bloque Central',
        nombre_corto: 'Central',
        pisos: 4,
        activo: true,
        facultad_id: 2,
        tipo_bloque_id: 3,
        coordenadas: { lat: -17.39, lng: -66.15 },
      });
    });

    it('devuelve null cuando no existe un bloque con ese id', async () => {
      const dataSource = createFakeDataSource();
      dataSource.query.mockResolvedValueOnce([]);

      const repository = new TypeormBloqueRepository(
        dataSource as unknown as any,
      );

      const snapshot = await repository.findById(999);

      expect(snapshot).toBeNull();
    });
  });

  describe('create', () => {
    it('inserta un bloque y devuelve el id generado', async () => {
      const dataSource = createFakeDataSource();
      dataSource.query.mockResolvedValueOnce([{ id: '42' }]);
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

      const result = await repository.create(command);

      expect(dataSource.query).toHaveBeenCalledTimes(1);
      const [sql, params] = dataSource.query.mock.calls[0];
      expect(sql).toContain(
        'INSERT INTO infraestructura.bloques (codigo, nombre, nombre_corto, pisos, coordenadas, activo, facultad_id, tipo_bloque_id)',
      );
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
      expect(result).toEqual({ id: 42 });
    });

    it('lanza ConflictException cuando postgres reporta codigo duplicado', async () => {
      const dataSource = createFakeDataSource();
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

      await expect(repository.create(command)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('isCodeTaken', () => {
    it('confirma si un codigo existe y admite excluir un id concreto', async () => {
      const dataSource = createFakeDataSource();
      dataSource.query
        .mockResolvedValueOnce([{ existe: 1 }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const repository = new TypeormBloqueRepository(
        dataSource as unknown as any,
      );

      const first = await repository.isCodeTaken('BLOQUE-101');
      const second = await repository.isCodeTaken('BLOQUE-101', 42);
      const third = await repository.isCodeTaken('BLOQUE-999');

      expect(first).toBe(true);
      expect(second).toBe(false);
      expect(third).toBe(false);

      expect(dataSource.query).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('WHERE codigo = $1'),
        ['BLOQUE-101'],
      );
      expect(dataSource.query).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('AND id <> $2'),
        ['BLOQUE-101', 42],
      );
    });
  });

  describe('update', () => {
    it('omite los campos no presentes y mantiene el orden de los parametros', async () => {
      const dataSource = createFakeDataSource();
      dataSource.query.mockResolvedValueOnce([{ id: 42 }]);
      const repository = new TypeormBloqueRepository(
        dataSource as unknown as any,
      );

      const command: UpdateBloqueCommand = {
        id: 42,
        nombre: 'Solo nombre',
        activo: true,
      };

      await repository.update(command);

      const [sql, params] = dataSource.query.mock.calls[0];
      expect(sql).toContain('nombre = $1');
      expect(sql).toContain('activo = $2');
      expect(sql).not.toContain('codigo =');
      expect(sql).not.toContain('coordenadas =');
      expect(params).toEqual(['Solo nombre', true, 42]);
    });

    it('lanza ConflictException cuando el update choca con un codigo duplicado', async () => {
      const dataSource = createFakeDataSource();
      const driverError = { code: '23505' };
      const queryError = new QueryFailedError(
        'UPDATE',
        [],
        driverError as unknown as Error,
      );
      dataSource.query.mockRejectedValueOnce(queryError);

      const repository = new TypeormBloqueRepository(
        dataSource as unknown as any,
      );

      const command: UpdateBloqueCommand = {
        id: 42,
        codigo: 'BLOQUE-NEW',
      };

      await expect(repository.update(command)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('list', () => {
    it('devuelve una lista paginada mapeando los campos esperados', async () => {
      const dataSource = createFakeDataSource();
      dataSource.query
        .mockResolvedValueOnce([
          {
            id: 5,
            codigo: 'BLOQ-1',
            nombre: 'Bloque 1',
            nombre_corto: 'B1',
            pisos: 3,
            activo: true,
            creado_en: new Date('2025-10-01T12:00:00.000Z'),
            facultad_nombre: 'Facultad Central',
            tipo_bloque_nombre: 'Académico',
          },
        ])
        .mockResolvedValueOnce([{ total: 15 }]);

      const repository = new TypeormBloqueRepository(
        dataSource as unknown as any,
      );

      const result = await repository.list({
        page: 1,
        take: 8,
        search: null,
        orderBy: 'nombre',
        orderDir: 'asc',
        facultadId: null,
        tipoBloqueId: null,
        activo: null,
        pisosMin: null,
        pisosMax: null,
      });

      expect(result.items).toEqual([
        {
          id: 5,
          codigo: 'BLOQ-1',
          nombre: 'Bloque 1',
          nombre_corto: 'B1',
          pisos: 3,
          activo: true,
          creado_en: '2025-10-01T12:00:00.000Z',
          facultad_nombre: 'Facultad Central',
          tipo_bloque_nombre: 'Académico',
        },
      ]);
      expect(result.meta).toEqual({
        total: 15,
        page: 1,
        take: 8,
        hasNextPage: true,
        hasPreviousPage: false,
      });
    });

    it('aplica filtros dinamicos y paginacion en la consulta SQL', async () => {
      const dataSource = createFakeDataSource();
      dataSource.query
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ total: 0 }]);

      const repository = new TypeormBloqueRepository(
        dataSource as unknown as any,
      );

      await repository.list({
        page: 2,
        take: 5,
        search: 'centro',
        orderBy: 'codigo',
        orderDir: 'desc',
        facultadId: 7,
        tipoBloqueId: 3,
        activo: false,
        pisosMin: 2,
        pisosMax: 6,
      });

      expect(dataSource.query).toHaveBeenCalledTimes(2);

      const [dataSql, dataParams] = dataSource.query.mock.calls[0];
      expect(dataSql).toContain('FROM infraestructura.bloques b');
      expect(dataSql).toContain('JOIN infraestructura.facultades f');
      expect(dataSql).toContain('JOIN infraestructura.tipo_bloques tb');
      expect(dataSql).toContain('b.codigo ILIKE $1');
      expect(dataSql).toContain('ORDER BY b.codigo DESC');
      expect(dataParams).toEqual([
        '%centro%',
        '%centro%',
        '%centro%',
        7,
        3,
        false,
        2,
        6,
        5,
        5,
      ]);

      const [countSql, countParams] = dataSource.query.mock.calls[1];
      expect(countSql).toContain('SELECT COUNT(*)::int AS total');
      expect(countParams).toEqual([
        '%centro%',
        '%centro%',
        '%centro%',
        7,
        3,
        false,
        2,
        6,
      ]);
    });
  });
});

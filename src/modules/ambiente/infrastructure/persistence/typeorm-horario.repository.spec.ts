import { ConflictException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { TypeormHorarioRepository } from './typeorm-horario.repository';
import { ReplaceHorariosCommand } from '../../domain/horario.repository.port';

// Creamos un QueryRunner falso para simular transacciones.
const createFakeRunner = () => ({
  connect: jest.fn(),
  startTransaction: jest.fn(),
  query: jest.fn(),
  commitTransaction: jest.fn(),
  rollbackTransaction: jest.fn(),
  release: jest.fn(),
});

// Creamos un DataSource falso que retorna nuestro QueryRunner falso.
const createFakeDataSource = (runner = createFakeRunner()) => ({
  createQueryRunner: jest.fn().mockReturnValue(runner),
  query: jest.fn(),
});

describe('TypeormHorarioRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('replaceForAmbiente', () => {
    it('borra franjas previas, inserta las nuevas y responde con totales', async () => {
      const runner = createFakeRunner();
      // Simulamos que el borrado e insert terminaron bien.
      runner.query.mockResolvedValueOnce([]); // delete
      runner.query.mockResolvedValueOnce([{ count: 2 }]); // insert
      const dataSource = createFakeDataSource(runner);
      const repo = new TypeormHorarioRepository(dataSource as unknown as any);

      const command: ReplaceHorariosCommand = {
        ambiente_id: 10,
        franjas: [
          { dia: 0, hora_inicio: '08:00', hora_fin: '10:00' },
          { dia: 1, hora_inicio: '11:00', hora_fin: '12:00' },
        ],
      };

      const result = await repo.replaceForAmbiente(command);

      // Validamos que se uso transaccion.
      expect(runner.startTransaction).toHaveBeenCalled();
      expect(runner.commitTransaction).toHaveBeenCalled();
      expect(runner.release).toHaveBeenCalled();

      // Primera query: delete
      const [deleteSql, deleteParams] = runner.query.mock.calls[0];
      expect(deleteSql.replace(/\s+/g, ' ').trim()).toContain(
        'DELETE FROM infraestructura.horarios WHERE ambiente_id = $1',
      );
      expect(deleteParams).toEqual([10]);

      // Segunda query: insert con valores en batch
      const [insertSql, insertParams] = runner.query.mock.calls[1];
      const normalizedInsert = insertSql.replace(/\s+/g, ' ').trim();
      expect(normalizedInsert).toContain(
        'INSERT INTO infraestructura.horarios',
      );
      expect(normalizedInsert).toContain(
        '(ambiente_id, dia, hora_inicio, hora_fin)',
      );
      expect(insertParams).toEqual([
        10,
        0,
        '08:00',
        '10:00',
        10,
        1,
        '11:00',
        '12:00',
      ]);

      expect(result).toEqual({ ambiente_id: 10, total: 2 });
    });

    it('maneja transaccion incluso cuando no hay franjas (solo borra)', async () => {
      const runner = createFakeRunner();
      runner.query.mockResolvedValueOnce([]); // delete
      const dataSource = createFakeDataSource(runner);
      const repo = new TypeormHorarioRepository(dataSource as unknown as any);

      const command: ReplaceHorariosCommand = { ambiente_id: 3, franjas: [] };

      const result = await repo.replaceForAmbiente(command);

      // No debe intentar insertar si no hay franjas.
      expect(runner.query).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ ambiente_id: 3, total: 0 });
      expect(runner.commitTransaction).toHaveBeenCalled();
    });

    it('lanza ConflictException si la BD detecta solapamiento (exclusion constraint)', async () => {
      const runner = createFakeRunner();
      const dataSource = createFakeDataSource(runner);
      const repo = new TypeormHorarioRepository(dataSource as unknown as any);

      const command: ReplaceHorariosCommand = {
        ambiente_id: 1,
        franjas: [{ dia: 0, hora_inicio: '09:00', hora_fin: '11:00' }],
      };

      // Delete ok, insert falla con 23P01 (violacion de exclusion).
      runner.query.mockResolvedValueOnce([]);
      const driverError = { code: '23P01' };
      const queryError = new QueryFailedError('INSERT', [], driverError as any);
      runner.query.mockRejectedValueOnce(queryError);

      await expect(repo.replaceForAmbiente(command)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(runner.rollbackTransaction).toHaveBeenCalled();
      expect(runner.release).toHaveBeenCalled();
    });
  });

  describe('listByAmbiente', () => {
    it('devuelve las franjas ordenadas por dia y hora_inicio', async () => {
      const runner = createFakeRunner();
      const dataSource = createFakeDataSource(runner);
      // Usamos dataSource.query (no queryRunner) para lecturas simples.
      dataSource.query.mockResolvedValueOnce([
        { dia: 1, hora_inicio: '11:00', hora_fin: '12:00' },
        { dia: 0, hora_inicio: '08:00', hora_fin: '10:00' },
      ]);
      const repo = new TypeormHorarioRepository(dataSource as unknown as any);

      const slots = await repo.listByAmbiente(7);

      const [sql, params] = dataSource.query.mock.calls[0];
      expect(sql.replace(/\s+/g, ' ').trim()).toContain(
        'SELECT dia, hora_inicio, hora_fin FROM infraestructura.horarios WHERE ambiente_id = $1 ORDER BY dia ASC, hora_inicio ASC',
      );
      expect(params).toEqual([7]);
      expect(slots).toEqual([
        { dia: 1, hora_inicio: '11:00', hora_fin: '12:00' },
        { dia: 0, hora_inicio: '08:00', hora_fin: '10:00' },
      ]);
    });
  });
});

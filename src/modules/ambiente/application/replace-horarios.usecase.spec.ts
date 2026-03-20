import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ReplaceHorariosUseCase } from './replace-horarios.usecase';
import { AmbienteRepositoryPort } from '../domain/ambiente.repository.port';
import { AmbientItem } from '../domain/ambiente.list.types';

class AmbienteRepoStub implements AmbienteRepositoryPort {
  constructor(private readonly fixtures: Record<number, AmbientItem | null>) {}

  async create(): Promise<{ id: number }> {
    return { id: 0 };
  }

  async isCodeTaken(): Promise<boolean> {
    return false;
  }

  async list(): Promise<any> {
    return {
      items: [],
      meta: {
        total: 0,
        page: 1,
        take: 10,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
  }

  async findById(id: number): Promise<AmbientItem | null> {
    return this.fixtures[id] ?? null;
  }

  async delete(): Promise<{ id: number }> {
    return { id: 0 };
  }

  async deleteAssets(): Promise<void> {}

  async update(): Promise<{ id: number }> {
    return { id: 0 };
  }
}

class DataSourceStub {
  queries: Array<{ sql: string; params: unknown[] }> = [];

  async query(sql: string, params: unknown[] = []) {
    this.queries.push({ sql, params });
    if (sql.includes('DELETE FROM infraestructura.horarios_operacion')) {
      return { rowCount: 0 };
    }
    if (sql.includes('INSERT INTO infraestructura.horarios_operacion')) {
      return { rowCount: params.length / 4 };
    }
    return [];
  }
}

describe('ReplaceHorariosUseCase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reemplaza todos los horarios de operacion cuando el ambiente existe y esta activo', async () => {
    const ambienteRepo = new AmbienteRepoStub({
      5: { id: 5, nombre: 'Aula 101', activo: true } as AmbientItem,
    });
    const dataSource = new DataSourceStub();

    const useCase = new ReplaceHorariosUseCase(
      ambienteRepo as any,
      dataSource as any,
    );

    const result = await useCase.execute({
      ambiente_id: 5,
      periodo: 45,
      horarios: [
        { dia: 0, apertura: '06:45', cierre: '21:45' },
        { dia: 5, apertura: '06:45', cierre: '14:15' },
      ],
    });

    expect(result).toEqual({ ambiente_id: 5, total: 2 });
    expect(dataSource.queries[0].sql).toContain(
      'DELETE FROM infraestructura.horarios_operacion',
    );
    expect(dataSource.queries[1].sql).toContain(
      'INSERT INTO infraestructura.horarios_operacion',
    );
  });

  it('lanza NotFound si el ambiente no existe', async () => {
    const ambienteRepo = new AmbienteRepoStub({});
    const dataSource = new DataSourceStub();

    const useCase = new ReplaceHorariosUseCase(
      ambienteRepo as any,
      dataSource as any,
    );

    await expect(
      useCase.execute({
        ambiente_id: 999,
        periodo: 45,
        horarios: [{ dia: 0, apertura: '06:45', cierre: '21:45' }],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lanza BadRequest si el ambiente esta inactivo', async () => {
    const ambienteRepo = new AmbienteRepoStub({
      2: { id: 2, nombre: 'Sala', activo: false } as AmbientItem,
    });
    const dataSource = new DataSourceStub();

    const useCase = new ReplaceHorariosUseCase(
      ambienteRepo as any,
      dataSource as any,
    );

    await expect(
      useCase.execute({
        ambiente_id: 2,
        periodo: 45,
        horarios: [{ dia: 0, apertura: '06:45', cierre: '21:45' }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('valida que dia este entre 0 y 6', async () => {
    const ambienteRepo = new AmbienteRepoStub({
      1: { id: 1, nombre: 'Aula', activo: true } as AmbientItem,
    });
    const dataSource = new DataSourceStub();

    const useCase = new ReplaceHorariosUseCase(
      ambienteRepo as any,
      dataSource as any,
    );

    await expect(
      useCase.execute({
        ambiente_id: 1,
        periodo: 45,
        horarios: [{ dia: 7, apertura: '06:45', cierre: '21:45' }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('valida que hora_inicio sea menor que hora_fin', async () => {
    const ambienteRepo = new AmbienteRepoStub({
      1: { id: 1, nombre: 'Aula', activo: true } as AmbientItem,
    });
    const dataSource = new DataSourceStub();

    const useCase = new ReplaceHorariosUseCase(
      ambienteRepo as any,
      dataSource as any,
    );

    await expect(
      useCase.execute({
        ambiente_id: 1,
        periodo: 45,
        horarios: [{ dia: 0, apertura: '21:45', cierre: '06:45' }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('valida formato HH:mm en apertura', async () => {
    const ambienteRepo = new AmbienteRepoStub({
      1: { id: 1, nombre: 'Aula', activo: true } as AmbientItem,
    });
    const dataSource = new DataSourceStub();

    const useCase = new ReplaceHorariosUseCase(
      ambienteRepo as any,
      dataSource as any,
    );

    await expect(
      useCase.execute({
        ambiente_id: 1,
        periodo: 45,
        horarios: [{ dia: 0, apertura: '6:45', cierre: '21:45' }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('valida formato HH:mm en cierre', async () => {
    const ambienteRepo = new AmbienteRepoStub({
      1: { id: 1, nombre: 'Aula', activo: true } as AmbientItem,
    });
    const dataSource = new DataSourceStub();

    const useCase = new ReplaceHorariosUseCase(
      ambienteRepo as any,
      dataSource as any,
    );

    await expect(
      useCase.execute({
        ambiente_id: 1,
        periodo: 45,
        horarios: [{ dia: 0, apertura: '06:45', cierre: '9pm' }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('valida periodo entero positivo', async () => {
    const ambienteRepo = new AmbienteRepoStub({
      1: { id: 1, nombre: 'Aula', activo: true } as AmbientItem,
    });
    const dataSource = new DataSourceStub();

    const useCase = new ReplaceHorariosUseCase(
      ambienteRepo as any,
      dataSource as any,
    );

    await expect(
      useCase.execute({
        ambiente_id: 1,
        periodo: -5,
        horarios: [{ dia: 0, apertura: '06:45', cierre: '21:45' }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('permite horario vacio para borrar todos los horarios', async () => {
    const ambienteRepo = new AmbienteRepoStub({
      1: { id: 1, nombre: 'Aula', activo: true } as AmbientItem,
    });
    const dataSource = new DataSourceStub();

    const useCase = new ReplaceHorariosUseCase(
      ambienteRepo as any,
      dataSource as any,
    );

    const result = await useCase.execute({
      ambiente_id: 1,
      periodo: 45,
      horarios: [],
    });

    expect(result).toEqual({ ambiente_id: 1, total: 0 });
    expect(dataSource.queries[0].sql).toContain(
      'DELETE FROM infraestructura.horarios_operacion',
    );
    expect(dataSource.queries.length).toBe(1);
  });
});

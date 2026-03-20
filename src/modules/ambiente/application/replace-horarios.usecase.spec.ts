import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ReplaceHorariosUseCase } from './replace-horarios.usecase';
import { AmbienteRepositoryPort } from '../domain/ambiente.repository.port';
import { AmbientItem } from '../domain/ambiente.list.types';
import { UpdateAmbienteCommand } from '../domain/commands/update-ambiente.command';

class AmbienteRepoStub implements AmbienteRepositoryPort {
  public lastUpdateCommand: UpdateAmbienteCommand | null = null;

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

  async update(command: UpdateAmbienteCommand): Promise<{ id: number }> {
    this.lastUpdateCommand = command;
    return { id: command.id };
  }
}

describe('ReplaceHorariosUseCase', () => {
  it('actualiza hora_apertura, hora_cierre y periodo cuando el ambiente existe y esta activo', async () => {
    const ambienteActivo: AmbientItem = {
      id: 5,
      codigo: 'A-1',
      nombre: 'Aula',
      nombre_corto: null,
      piso: 1,
      capacidad: { total: 10, examen: 10 },
      dimension: { largo: 1, ancho: 1, alto: 1, unid_med: 'metros' },
      clases: true,
      activo: true,
      creado_en: '2024-01-01',
      tipo_ambiente_id: 1,
      bloque_id: 1,
    };

    const ambienteRepo = new AmbienteRepoStub({ 5: ambienteActivo });
    const useCase = new ReplaceHorariosUseCase(ambienteRepo as any);

    const result = await useCase.execute({
      ambiente_id: 5,
      hora_apertura: '07:00',
      hora_cierre: '21:00',
      periodo: 90,
    });

    expect(result).toEqual({ id: 5 });
    expect(ambienteRepo.lastUpdateCommand).toEqual({
      id: 5,
      hora_apertura: '07:00',
      hora_cierre: '21:00',
      periodo: 90,
    });
  });

  it('actualiza solo los campos enviados (parcial)', async () => {
    const ambienteActivo: AmbientItem = {
      id: 6,
      codigo: 'A-2',
      nombre: 'Aula',
      nombre_corto: null,
      piso: 1,
      capacidad: { total: 10, examen: 10 },
      dimension: { largo: 1, ancho: 1, alto: 1, unid_med: 'metros' },
      clases: true,
      activo: true,
      creado_en: '2024-01-01',
      tipo_ambiente_id: 1,
      bloque_id: 1,
    };

    const ambienteRepo = new AmbienteRepoStub({ 6: ambienteActivo });
    const useCase = new ReplaceHorariosUseCase(ambienteRepo as any);

    await useCase.execute({
      ambiente_id: 6,
      hora_apertura: '08:00',
    });

    expect(ambienteRepo.lastUpdateCommand).toEqual({
      id: 6,
      hora_apertura: '08:00',
    });
  });

  it('lanza NotFound si el ambiente no existe', async () => {
    const ambienteRepo = new AmbienteRepoStub({});
    const useCase = new ReplaceHorariosUseCase(ambienteRepo as any);

    await expect(
      useCase.execute({
        ambiente_id: 999,
        hora_apertura: '07:00',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lanza BadRequest si el ambiente esta inactivo', async () => {
    const ambienteInactivo: AmbientItem = {
      id: 2,
      codigo: 'B-1',
      nombre: 'Sala',
      nombre_corto: null,
      piso: 1,
      capacidad: { total: 10, examen: 10 },
      dimension: { largo: 1, ancho: 1, alto: 1, unid_med: 'metros' },
      clases: true,
      activo: false,
      creado_en: '2024-01-01',
      tipo_ambiente_id: 1,
      bloque_id: 1,
    };

    const ambienteRepo = new AmbienteRepoStub({ 2: ambienteInactivo });
    const useCase = new ReplaceHorariosUseCase(ambienteRepo as any);

    await expect(
      useCase.execute({
        ambiente_id: 2,
        hora_apertura: '07:00',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('valida formato HH:mm en hora_apertura', async () => {
    const ambienteActivo: AmbientItem = {
      id: 3,
      codigo: 'A-3',
      nombre: 'Lab',
      nombre_corto: null,
      piso: 1,
      capacidad: { total: 10, examen: 10 },
      dimension: { largo: 1, ancho: 1, alto: 1, unid_med: 'metros' },
      clases: true,
      activo: true,
      creado_en: '2024-01-01',
      tipo_ambiente_id: 1,
      bloque_id: 1,
    };

    const ambienteRepo = new AmbienteRepoStub({ 3: ambienteActivo });
    const useCase = new ReplaceHorariosUseCase(ambienteRepo as any);

    await expect(
      useCase.execute({
        ambiente_id: 3,
        hora_apertura: '7:00',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('valida formato HH:mm en hora_cierre', async () => {
    const ambienteActivo: AmbientItem = {
      id: 4,
      codigo: 'A-4',
      nombre: 'Lab',
      nombre_corto: null,
      piso: 1,
      capacidad: { total: 10, examen: 10 },
      dimension: { largo: 1, ancho: 1, alto: 1, unid_med: 'metros' },
      clases: true,
      activo: true,
      creado_en: '2024-01-01',
      tipo_ambiente_id: 1,
      bloque_id: 1,
    };

    const ambienteRepo = new AmbienteRepoStub({ 4: ambienteActivo });
    const useCase = new ReplaceHorariosUseCase(ambienteRepo as any);

    await expect(
      useCase.execute({
        ambiente_id: 4,
        hora_cierre: '9pm',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('valida que hora_apertura sea menor que hora_cierre cuando ambos existen', async () => {
    const ambienteActivo: AmbientItem = {
      id: 5,
      codigo: 'A-5',
      nombre: 'Aula',
      nombre_corto: null,
      piso: 1,
      capacidad: { total: 10, examen: 10 },
      dimension: { largo: 1, ancho: 1, alto: 1, unid_med: 'metros' },
      clases: true,
      activo: true,
      creado_en: '2024-01-01',
      tipo_ambiente_id: 1,
      bloque_id: 1,
    };

    const ambienteRepo = new AmbienteRepoStub({ 5: ambienteActivo });
    const useCase = new ReplaceHorariosUseCase(ambienteRepo as any);

    await expect(
      useCase.execute({
        ambiente_id: 5,
        hora_apertura: '18:00',
        hora_cierre: '17:00',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('permite null para limpiar campos', async () => {
    const ambienteActivo: AmbientItem = {
      id: 6,
      codigo: 'A-6',
      nombre: 'Aula',
      nombre_corto: null,
      piso: 1,
      capacidad: { total: 10, examen: 10 },
      dimension: { largo: 1, ancho: 1, alto: 1, unid_med: 'metros' },
      clases: true,
      activo: true,
      creado_en: '2024-01-01',
      tipo_ambiente_id: 1,
      bloque_id: 1,
      hora_apertura: '07:00',
      hora_cierre: '21:00',
    };

    const ambienteRepo = new AmbienteRepoStub({ 6: ambienteActivo });
    const useCase = new ReplaceHorariosUseCase(ambienteRepo as any);

    const result = await useCase.execute({
      ambiente_id: 6,
      hora_apertura: null,
      hora_cierre: null,
    });

    expect(result).toEqual({ id: 6 });
    expect(ambienteRepo.lastUpdateCommand).toEqual({
      id: 6,
      hora_apertura: null,
      hora_cierre: null,
    });
  });
});

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ReplaceHorariosUseCase } from './replace-horarios.usecase';
import {
  HorarioRepositoryPort,
  HorarioSlot,
  ReplaceHorariosCommand,
} from '../domain/horario.repository.port';
import { AmbienteRepositoryPort } from '../domain/ambiente.repository.port';
import { AmbientItem } from '../domain/ambiente.list.types';

class HorarioRepoStub implements HorarioRepositoryPort {
  public lastCommand: ReplaceHorariosCommand | null = null;

  async replaceForAmbiente(command: ReplaceHorariosCommand) {
    // Guardamos el comando para poder inspeccionarlo en las pruebas.
    this.lastCommand = command;
    // Simulamos que la BD devolvi? el id y la cantidad de franjas insertadas.
    return { ambiente_id: command.ambiente_id, total: command.franjas.length };
  }

  async listByAmbiente(): Promise<HorarioSlot[]> {
    // No se usa en estas pruebas; devolvemos lista vac?a.
    return [];
  }
}

class AmbienteRepoStub implements AmbienteRepositoryPort {
  constructor(private readonly fixtures: Record<number, AmbientItem | null>) {}

  async create(): Promise<{ id: number }> {
    // No usado aqu?.
    return { id: 0 };
  }

  async isCodeTaken(): Promise<boolean> {
    // No usado aqu?.
    return false;
  }

  async list(): Promise<any> {
    // No usado aqu?.
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
    // Retornamos el ambiente precargado o null si no existe.
    return this.fixtures[id] ?? null;
  }

  async delete(): Promise<{ id: number }> {
    // No usado aqu?.
    return { id: 0 };
  }

  async deleteAssets(): Promise<void> {
    // No usado aqu?.
  }

  async update(): Promise<{ id: number }> {
    // No usado aqu?.
    return { id: 0 };
  }
}

describe('ReplaceHorariosUseCase', () => {
  it('reemplaza horarios cuando el ambiente existe y est? activo', async () => {
    // Preparamos un ambiente activo de ejemplo.
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

    // Creamos stubs de repositorios con el ambiente activo disponible.
    const horarioRepo = new HorarioRepoStub();
    const ambienteRepo = new AmbienteRepoStub({ 5: ambienteActivo });

    // Instanciamos el caso de uso con los stubs.
    const useCase = new ReplaceHorariosUseCase(
      horarioRepo as any,
      ambienteRepo as any,
    );

    // Definimos las franjas a reemplazar.
    const franjas: HorarioSlot[] = [
      { dia: 0, hora_inicio: '08:00', hora_fin: '10:00' },
      { dia: 1, hora_inicio: '11:00', hora_fin: '12:00' },
    ];

    // Ejecutamos el caso de uso.
    const result = await useCase.execute({ ambiente_id: 5, franjas });

    // Verificamos que la respuesta coincide con lo insertado.
    expect(result).toEqual({ ambiente_id: 5, total: 2 });
    // Verificamos que el comando enviado al repositorio contiene las franjas limpias.
    expect(horarioRepo.lastCommand).toEqual({ ambiente_id: 5, franjas });
  });

  it('lanza NotFound si el ambiente no existe', async () => {
    // Preparamos repos con ambiente inexistente (null).
    const horarioRepo = new HorarioRepoStub();
    const ambienteRepo = new AmbienteRepoStub({});
    const useCase = new ReplaceHorariosUseCase(
      horarioRepo as any,
      ambienteRepo as any,
    );

    // Ejecutamos y esperamos un NotFoundException.
    await expect(
      useCase.execute({
        ambiente_id: 999,
        franjas: [{ dia: 0, hora_inicio: '08:00', hora_fin: '09:00' }],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lanza BadRequest si el ambiente est? inactivo', async () => {
    // Ambiente existente pero inactivo.
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

    const horarioRepo = new HorarioRepoStub();
    const ambienteRepo = new AmbienteRepoStub({ 2: ambienteInactivo });
    const useCase = new ReplaceHorariosUseCase(
      horarioRepo as any,
      ambienteRepo as any,
    );

    // Ejecutamos y validamos BadRequestException.
    await expect(
      useCase.execute({
        ambiente_id: 2,
        franjas: [{ dia: 0, hora_inicio: '08:00', hora_fin: '09:00' }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('valida que hora_inicio sea menor que hora_fin', async () => {
    // Ambiente activo para permitir la validaci?n de horas.
    const ambienteActivo: AmbientItem = {
      id: 1,
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

    const horarioRepo = new HorarioRepoStub();
    const ambienteRepo = new AmbienteRepoStub({ 1: ambienteActivo });
    const useCase = new ReplaceHorariosUseCase(
      horarioRepo as any,
      ambienteRepo as any,
    );

    // Hora fin menor que inicio debe fallar.
    await expect(
      useCase.execute({
        ambiente_id: 1,
        franjas: [{ dia: 0, hora_inicio: '10:00', hora_fin: '08:00' }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('valida formato HH:mm en las horas', async () => {
    // Ambiente activo para permitir la validaci?n de formato.
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

    const horarioRepo = new HorarioRepoStub();
    const ambienteRepo = new AmbienteRepoStub({ 3: ambienteActivo });
    const useCase = new ReplaceHorariosUseCase(
      horarioRepo as any,
      ambienteRepo as any,
    );

    // Formato inv?lido debe lanzar BadRequestException.
    await expect(
      useCase.execute({
        ambiente_id: 3,
        franjas: [{ dia: 0, hora_inicio: '8', hora_fin: '10:00' }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

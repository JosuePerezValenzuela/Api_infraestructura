import { NotFoundException } from '@nestjs/common';
import { GetAmbienteCompletoUseCase } from './get-ambiente-completo.usecase';

const createAmbienteRepo = () => ({
  findById: jest.fn(),
});

const createHorarioRepo = () => ({
  findByAmbienteId: jest.fn(),
});

const createListActivosUseCase = () => ({
  execute: jest.fn(),
});

describe('GetAmbienteCompletoUseCase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('devuelve ambiente completo con horarios y activos cuando el ambiente existe', async () => {
    const ambienteRepo = createAmbienteRepo();
    const horarioRepo = createHorarioRepo();
    const listActivosUseCase = createListActivosUseCase();

    const mockAmbiente = {
      id: 5,
      codigo: 'AULA-101',
      nombre: 'Aula 101',
      nombre_corto: 'A101',
      piso: 1,
      capacidad: { total: 30, examen: 25 },
      dimension: { largo: 10, ancho: 8, alto: 3, unid_med: 'm' },
      clases: true,
      activo: true,
      creado_en: '2025-01-01T00:00:00.000Z',
      tipo_ambiente_id: 1,
      bloque_id: 2,
    };

    const mockHorarios = [
      {
        dia: 0,
        nombre_dia: 'Lunes',
        apertura: '07:00',
        cierre: '21:00',
        periodo: 45,
      },
      {
        dia: 1,
        nombre_dia: 'Martes',
        apertura: '07:00',
        cierre: '21:00',
        periodo: 45,
      },
    ];

    const mockActivosResult = {
      items: [
        {
          id: 1,
          nia: 'NIA-001',
          nombre: 'Proyector',
          descripcion: 'Proyector EPSON',
          creado_en: '2025-01-15T10:00:00.000Z',
          ambiente_id: 5,
          ambiente_nombre: 'Aula 101',
          ambiente_codigo: 'AULA-101',
        },
      ],
      meta: {
        total: 1,
        page: 1,
        take: 8,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };

    ambienteRepo.findById.mockResolvedValueOnce(mockAmbiente);
    horarioRepo.findByAmbienteId.mockResolvedValueOnce(mockHorarios);
    listActivosUseCase.execute.mockResolvedValueOnce(mockActivosResult);

    const useCase = new GetAmbienteCompletoUseCase(
      ambienteRepo as any,
      horarioRepo as any,
      listActivosUseCase as any,
    );

    const result = await useCase.execute({ ambiente_id: 5 });

    expect(ambienteRepo.findById).toHaveBeenCalledWith(5);
    expect(horarioRepo.findByAmbienteId).toHaveBeenCalledWith(5);
    expect(listActivosUseCase.execute).toHaveBeenCalledWith({
      ambienteId: 5,
      page: 1,
      limit: 150,
    });
    expect(result.ambiente).toEqual(mockAmbiente);
    expect(result.horarios).toHaveLength(2);
    expect(result.activos).toEqual(mockActivosResult);
  });

  it('lanza NOT_FOUND cuando el ambiente no existe', async () => {
    const ambienteRepo = createAmbienteRepo();
    const horarioRepo = createHorarioRepo();
    const listActivosUseCase = createListActivosUseCase();

    ambienteRepo.findById.mockResolvedValueOnce(null);

    const useCase = new GetAmbienteCompletoUseCase(
      ambienteRepo as any,
      horarioRepo as any,
      listActivosUseCase as any,
    );

    await expect(useCase.execute({ ambiente_id: 999 })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(ambienteRepo.findById).toHaveBeenCalledWith(999);
  });

  it('lanza BadRequest cuando ambiente_id no es entero positivo', async () => {
    const ambienteRepo = createAmbienteRepo();
    const horarioRepo = createHorarioRepo();
    const listActivosUseCase = createListActivosUseCase();

    const useCase = new GetAmbienteCompletoUseCase(
      ambienteRepo as any,
      horarioRepo as any,
      listActivosUseCase as any,
    );

    await expect(useCase.execute({ ambiente_id: 0 })).rejects.toThrow();
    await expect(useCase.execute({ ambiente_id: -1 })).rejects.toThrow();
    await expect(useCase.execute({ ambiente_id: 1.5 })).rejects.toThrow();
  });
});

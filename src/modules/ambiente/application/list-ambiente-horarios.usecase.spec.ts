import { NotFoundException } from '@nestjs/common';
import { ListAmbienteHorariosUseCase } from './list-ambiente-horarios.usecase';
import { HorarioSlot } from '../domain/horario.repository.port';

const createAmbienteRepo = () => ({
  findById: jest.fn(),
});

const createHorarioRepo = () => ({
  listByAmbiente: jest.fn(),
});

describe('ListAmbienteHorariosUseCase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('devuelve horarios y metadatos de apertura/cierre/periodo para un ambiente existente', async () => {
    const ambienteRepo = createAmbienteRepo();
    const horarioRepo = createHorarioRepo();
    ambienteRepo.findById.mockResolvedValueOnce({
      id: 5,
      activo: true,
      hora_apertura: '07:00',
      hora_cierre: '21:00',
      periodo: 90,
    });
    const horarios: HorarioSlot[] = [
      { dia: 0, hora_inicio: '08:00', hora_fin: '10:00' },
      { dia: 2, hora_inicio: '14:00', hora_fin: '16:00' },
    ];
    horarioRepo.listByAmbiente.mockResolvedValueOnce(horarios);

    const useCase = new ListAmbienteHorariosUseCase(
      horarioRepo as any,
      ambienteRepo as any,
    );

    const result = await useCase.execute({ ambiente_id: 5 });

    expect(ambienteRepo.findById).toHaveBeenCalledWith(5);
    expect(horarioRepo.listByAmbiente).toHaveBeenCalledWith(5);
    expect(result).toEqual({
      items: horarios,
      hora_apertura: '07:00',
      hora_cierre: '21:00',
      periodo: 90,
    });
  });

  it('lanza NOT_FOUND cuando el ambiente no existe', async () => {
    const ambienteRepo = createAmbienteRepo();
    const horarioRepo = createHorarioRepo();
    ambienteRepo.findById.mockResolvedValueOnce(null);

    const useCase = new ListAmbienteHorariosUseCase(
      horarioRepo as any,
      ambienteRepo as any,
    );

    await expect(useCase.execute({ ambiente_id: 99 })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(ambienteRepo.findById).toHaveBeenCalledWith(99);
    expect(horarioRepo.listByAmbiente).not.toHaveBeenCalled();
  });
});

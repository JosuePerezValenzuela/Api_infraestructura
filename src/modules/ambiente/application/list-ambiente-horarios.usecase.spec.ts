import { NotFoundException } from '@nestjs/common';
import { ListAmbienteHorariosUseCase } from './list-ambiente-horarios.usecase';

const createAmbienteRepo = () => ({
  findById: jest.fn(),
});

describe('ListAmbienteHorariosUseCase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('devuelve hora_apertura, hora_cierre y periodo para un ambiente existente', async () => {
    const ambienteRepo = createAmbienteRepo();
    ambienteRepo.findById.mockResolvedValueOnce({
      id: 5,
      activo: true,
      hora_apertura: '07:00',
      hora_cierre: '21:00',
      periodo: 90,
    });

    const useCase = new ListAmbienteHorariosUseCase(ambienteRepo as any);

    const result = await useCase.execute({ ambiente_id: 5 });

    expect(ambienteRepo.findById).toHaveBeenCalledWith(5);
    expect(result).toEqual({
      hora_apertura: '07:00',
      hora_cierre: '21:00',
      periodo: 90,
    });
  });

  it('lanza NOT_FOUND cuando el ambiente no existe', async () => {
    const ambienteRepo = createAmbienteRepo();
    ambienteRepo.findById.mockResolvedValueOnce(null);

    const useCase = new ListAmbienteHorariosUseCase(ambienteRepo as any);

    await expect(useCase.execute({ ambiente_id: 99 })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(ambienteRepo.findById).toHaveBeenCalledWith(99);
  });
});

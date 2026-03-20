import { NotFoundException } from '@nestjs/common';
import { ListAmbienteHorariosUseCase } from './list-ambiente-horarios.usecase';

const createAmbienteRepo = () => ({
  findById: jest.fn(),
});

const createDataSource = () => ({
  query: jest.fn(),
});

describe('ListAmbienteHorariosUseCase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('devuelve estructura con horarios de operacion por dia para un ambiente existente', async () => {
    const ambienteRepo = createAmbienteRepo();
    const dataSource = createDataSource();

    ambienteRepo.findById.mockResolvedValueOnce({
      id: 5,
      nombre: 'Aula 101',
    });

    dataSource.query
      .mockResolvedValueOnce([
        { id: 1, dia: 0, hora_inicio: '06:45', hora_fin: '21:45', periodo: 45 },
        { id: 2, dia: 1, hora_inicio: '06:45', hora_fin: '21:45', periodo: 45 },
        { id: 3, dia: 5, hora_inicio: '06:45', hora_fin: '14:15', periodo: 45 },
      ])
      .mockResolvedValueOnce([]);

    const useCase = new ListAmbienteHorariosUseCase(
      ambienteRepo as any,
      dataSource as any,
    );

    const result = await useCase.execute({ ambiente_id: 5 });

    expect(ambienteRepo.findById).toHaveBeenCalledWith(5);
    expect(result).toEqual({
      ambiente_id: 5,
      ambiente_nombre: 'Aula 101',
      periodo: 45,
      horarios: [
        { dia: 0, nombre_dia: 'Lunes', apertura: '06:45', cierre: '21:45' },
        { dia: 1, nombre_dia: 'Martes', apertura: '06:45', cierre: '21:45' },
        { dia: 5, nombre_dia: 'Sabado', apertura: '06:45', cierre: '14:15' },
      ],
    });
  });

  it('lanza NOT_FOUND cuando el ambiente no existe', async () => {
    const ambienteRepo = createAmbienteRepo();
    const dataSource = createDataSource();

    ambienteRepo.findById.mockResolvedValueOnce(null);

    const useCase = new ListAmbienteHorariosUseCase(
      ambienteRepo as any,
      dataSource as any,
    );

    await expect(useCase.execute({ ambiente_id: 99 })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(ambienteRepo.findById).toHaveBeenCalledWith(99);
  });
});

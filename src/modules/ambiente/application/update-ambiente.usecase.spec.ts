// En esta suite explicamos paso a paso cómo debe comportarse UpdateAmbienteUseCase para que cualquiera pueda seguirlo.
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdateAmbienteUseCase } from './update-ambiente.usecase';
import { AmbienteRepositoryPort } from '../domain/ambiente.repository.port';
import { BloqueRepositoryPort } from '../../bloque/domain/bloque.repository.port';
import { TipoAmbienteRepositoryPort } from '../../tipo-ambiente/domain/tipo-ambiente.repository.port';

interface AmbienteRepoMock extends AmbienteRepositoryPort {
  findById: jest.Mock<Promise<any>, [number]>;
  isCodeTaken: jest.Mock<Promise<boolean>, [string, number?]>;
  update: jest.Mock<Promise<{ id: number }>, [any]>;
}

interface BloqueRepoMock extends BloqueRepositoryPort {
  findById: jest.Mock<
    Promise<{ id: number; activo: boolean } | null>,
    [number]
  >;
}

interface TipoAmbienteRepoMock extends TipoAmbienteRepositoryPort {
  findById: jest.Mock<
    Promise<{ id: number; activo: boolean } | null>,
    [number]
  >;
}

@Injectable()
class FakeUpdateAmbienteUseCase extends UpdateAmbienteUseCase {}

const currentAmbiente = {
  id: 10,
  codigo: 'LAB-01',
  nombre: 'Laboratorio viejo',
  nombre_corto: 'Lab',
  piso: 1,
  capacidad: { total: 20, examen: 10 },
  dimension: { largo: 10, ancho: 5, alto: 3, unid_med: 'metros' },
  clases: true,
  activo: true,
  bloque_id: 8,
  tipo_ambiente_id: 5,
};

describe('UpdateAmbienteUseCase', () => {
  const buildSystem = (options?: {
    bloqueActivo?: boolean;
    tipoActivo?: boolean;
  }) => {
    const ambienteRepo: AmbienteRepoMock = {
      create: jest.fn(),
      delete: jest.fn(),
      deleteAssets: jest.fn(),
      findById: jest.fn().mockResolvedValue(currentAmbiente),
      isCodeTaken: jest.fn().mockResolvedValue(false),
      list: jest.fn(),
      update: jest.fn().mockResolvedValue({ id: 10 }),
    };
    const bloqueRepo: BloqueRepoMock = {
      findById: jest
        .fn()
        .mockResolvedValue(
          options?.bloqueActivo === false
            ? { id: 8, activo: false }
            : { id: 8, activo: true },
        ),
    };
    const tipoRepo: TipoAmbienteRepoMock = {
      findById: jest
        .fn()
        .mockResolvedValue(
          options?.tipoActivo === false
            ? { id: 5, activo: false }
            : { id: 5, activo: true },
        ),
    };

    const useCase = new FakeUpdateAmbienteUseCase(
      ambienteRepo as unknown as AmbienteRepositoryPort,
      bloqueRepo as unknown as BloqueRepositoryPort,
      tipoRepo as unknown as TipoAmbienteRepositoryPort,
    );

    return { useCase, ambienteRepo, bloqueRepo, tipoRepo };
  };

  it('actualiza campos y normaliza valores correctamente', async () => {
    const { useCase, ambienteRepo } = buildSystem();
    const result = await useCase.execute({
      id: 10,
      input: {
        nombre: '  Nuevo Nombre  ',
        capacidad: { total: 30, examen: 20 },
        dimension: { largo: 9, ancho: 4, alto: 3, unid_med: 'metros' },
      },
    });

    expect(ambienteRepo.update).toHaveBeenCalledWith({
      id: 10,
      nombre: 'Nuevo Nombre',
      capacidad: { total: 30, examen: 20 },
      dimension: { largo: 9, ancho: 4, alto: 3, unid_med: 'metros' },
    });
    expect(result).toEqual({ id: 10 });
  });

  it('lanza NotFoundException si el ambiente no existe', async () => {
    const { useCase, ambienteRepo } = buildSystem();
    ambienteRepo.findById.mockResolvedValueOnce(null);

    await expect(
      useCase.execute({ id: 999, input: { nombre: 'Test' } }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lanza BadRequestException si no se envía ningún campo', async () => {
    const { useCase } = buildSystem();
    await expect(useCase.execute({ id: 10, input: {} })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('valida unicidad del codigo', async () => {
    const { useCase, ambienteRepo } = buildSystem();
    ambienteRepo.isCodeTaken.mockResolvedValueOnce(true);

    await expect(
      useCase.execute({ id: 10, input: { codigo: 'LAB-NEW' } }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('valida bloque y tipo de ambiente cuando se actualizan', async () => {
    const { useCase, bloqueRepo, tipoRepo } = buildSystem({
      bloqueActivo: false,
      tipoActivo: true,
    });

    await expect(
      useCase.execute({ id: 10, input: { bloque_id: 99 } }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(bloqueRepo.findById).toHaveBeenCalledWith(99);

    // tipificar tipo inactivo
    const { useCase: useCase2, tipoRepo: tipoRepo2 } = buildSystem({
      tipoActivo: false,
    });
    await expect(
      useCase2.execute({ id: 10, input: { tipo_ambiente_id: 77 } }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tipoRepo2.findById).toHaveBeenCalledWith(77);
  });
});

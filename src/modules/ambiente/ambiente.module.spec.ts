jest.mock('ioredis', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    scan: jest.fn(),
    on: jest.fn(),
  })),
}));

import { MODULE_METADATA } from '@nestjs/common/constants';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { CacheService } from '../_shared/infrastructure/cache/cache.service';
import { BloqueRepositoryPort } from '../bloque/domain/bloque.repository.port';
import { AmbienteRepositoryPort } from './domain/ambiente.repository.port';
import { AmbientesDisponiblesRepositoryPort } from './domain/ambiente.disponibles.port';
import { HorarioRepositoryPort } from './domain/horario.repository.port';
import { TipoAmbienteRepositoryPort } from '../tipo-ambiente/domain/tipo-ambiente.repository.port';
import { CreateAmbienteUseCase } from './application/create-ambiente.usecase';
import { ListAmbientesUseCase } from './application/list-ambientes.usecase';
import { ListAmbientesDisponiblesUseCase } from './application/list-ambientes-disponibles.usecase';
import { DeleteAmbienteUseCase } from './application/delete-ambiente.usecase';
import { UpdateAmbienteUseCase } from './application/update-ambiente.usecase';
import { ReplaceHorariosUseCase } from './application/replace-horarios.usecase';
import { ListAmbienteHorariosUseCase } from './application/list-ambiente-horarios.usecase';
import { GetAmbienteCompletoUseCase } from './application/get-ambiente-completo.usecase';
import { BuscarAmbienteHorarioUseCase } from './application/buscar-ambiente-horario.usecase';
import { AmbienteModule } from './ambiente.module';
import { ListActivosUseCase } from '../activo/application/list-activos.usecase';

const createAmbienteRepositoryMock = () => ({
  create: jest.fn(),
  isCodeTaken: jest.fn(),
  list: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  deleteAssets: jest.fn(),
  findByIdWithRelations: jest.fn(),
});

const createDisponiblesRepositoryMock = () => ({
  listDisponibles: jest.fn(),
});

const createHorarioRepositoryMock = () => ({
  findByAmbienteId: jest.fn(),
  replaceForAmbiente: jest.fn(),
  listByAmbiente: jest.fn(),
  deleteByAmbienteId: jest.fn(),
});

const createBloqueRepositoryMock = () => ({
  findById: jest.fn(),
  isCodeTaken: jest.fn(),
  list: jest.fn(),
  findRelatedAmbientes: jest.fn(),
});

const createTipoAmbienteRepositoryMock = () => ({
  findById: jest.fn(),
  isCodeTaken: jest.fn(),
  list: jest.fn(),
});

const createListActivosUseCaseMock = () => ({
  execute: jest.fn(),
});

describe('AmbienteModule', () => {
  it('registers CacheService in the module providers', () => {
    const providers = Reflect.getMetadata(
      MODULE_METADATA.PROVIDERS,
      AmbienteModule,
    );

    expect(providers).toEqual(expect.arrayContaining([CacheService]));
  });

  it('resolves CacheService and injects it into ambiente use cases', async () => {
    const providers = Reflect.getMetadata(
      MODULE_METADATA.PROVIDERS,
      AmbienteModule,
    );
    const listActivosUseCaseMock = createListActivosUseCaseMock();

    const moduleRef = await Test.createTestingModule({
      providers: [
        ...providers,
        {
          provide: BloqueRepositoryPort,
          useValue: createBloqueRepositoryMock(),
        },
        {
          provide: TipoAmbienteRepositoryPort,
          useValue: createTipoAmbienteRepositoryMock(),
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: unknown) => {
              if (key === 'REDIS_HOST') return 'redis';
              if (key === 'REDIS_PORT') return 6379;
              if (key === 'CACHE_TTL') return defaultValue ?? 300;
              return defaultValue;
            }),
          },
        },
        {
          provide: getDataSourceToken(),
          useValue: { query: jest.fn() },
        },
        {
          provide: ListActivosUseCase,
          useValue: listActivosUseCaseMock,
        },
      ],
    })
      .overrideProvider(AmbienteRepositoryPort)
      .useValue(createAmbienteRepositoryMock())
      .overrideProvider(AmbientesDisponiblesRepositoryPort)
      .useValue(createDisponiblesRepositoryMock())
      .overrideProvider(HorarioRepositoryPort)
      .useValue(createHorarioRepositoryMock())
      .compile();

    const cacheService = moduleRef.get(CacheService);
    const createUseCase = moduleRef.get(CreateAmbienteUseCase);
    const listUseCase = moduleRef.get(ListAmbientesUseCase);
    const disponiblesUseCase = moduleRef.get(ListAmbientesDisponiblesUseCase);
    const deleteUseCase = moduleRef.get(DeleteAmbienteUseCase);
    const updateUseCase = moduleRef.get(UpdateAmbienteUseCase);
    const replaceUseCase = moduleRef.get(ReplaceHorariosUseCase);
    const listHorariosUseCase = moduleRef.get(ListAmbienteHorariosUseCase);
    const getCompletoUseCase = moduleRef.get(GetAmbienteCompletoUseCase);
    const buscarHorarioUseCase = moduleRef.get(BuscarAmbienteHorarioUseCase);

    expect(cacheService).toBeInstanceOf(CacheService);
    expect((createUseCase as any).cacheService).toBe(cacheService);
    expect((listUseCase as any).cacheService).toBe(cacheService);
    expect((disponiblesUseCase as any).cacheService).toBe(cacheService);
    expect((deleteUseCase as any).cacheService).toBe(cacheService);
    expect((updateUseCase as any).cacheService).toBe(cacheService);
    expect((replaceUseCase as any).cacheService).toBe(cacheService);
    expect((listHorariosUseCase as any).dataSource).toBeDefined();
    expect((getCompletoUseCase as any).listActivosUseCase).toBe(
      listActivosUseCaseMock,
    );
    expect((buscarHorarioUseCase as any).dataSource).toBeDefined();
  });
});

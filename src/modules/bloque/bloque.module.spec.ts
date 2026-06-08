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
import { CacheService } from '../_shared/infrastructure/cache/cache.service';
import { RelationshipsPort } from '../_shared/relationships/domain/relationships.port';
import { FacultadRepositoryPort } from '../facultad/domain/facultad.repository.port';
import { TipoBloqueRepositoryPort } from '../tipo-bloque/domain/tipo-bloque.repository.port';
import { CreateBloqueUseCase } from './application/create-bloque.usecase';
import { DeleteBloqueUseCase } from './application/delete-bloque.usecase';
import { ListBloquesUseCase } from './application/list-bloques.usecase';
import { UpdateBloqueUseCase } from './application/update-bloque.usecase';
import { BloqueModule } from './bloque.module';
import { BloqueRepositoryPort } from './domain/bloque.repository.port';

const createBloqueRepositoryMock = () => ({
  create: jest.fn(),
  isCodeTaken: jest.fn(),
  list: jest.fn(),
  update: jest.fn(),
  findById: jest.fn(),
  findRelatedAmbientes: jest.fn(),
  delete: jest.fn(),
});

describe('BloqueModule', () => {
  it('registers CacheService in the module providers', () => {
    const providers = Reflect.getMetadata(
      MODULE_METADATA.PROVIDERS,
      BloqueModule,
    );

    expect(providers).toEqual(expect.arrayContaining([CacheService]));
  });

  it('resolves CacheService and injects it into bloque use cases', async () => {
    const providers = Reflect.getMetadata(
      MODULE_METADATA.PROVIDERS,
      BloqueModule,
    );
    const moduleRef = await Test.createTestingModule({
      providers: [
        ...providers,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: unknown) => {
              if (key === 'REDIS_HOST') return 'redis';
              if (key === 'REDIS_PORT') return 6379;
              return defaultValue;
            }),
          },
        },
        {
          provide: FacultadRepositoryPort,
          useValue: {
            findById: jest.fn(),
            findCampusById: jest.fn(),
            findCampusFacultadRelationship: jest.fn(),
          },
        },
        {
          provide: TipoBloqueRepositoryPort,
          useValue: { findById: jest.fn() },
        },
        {
          provide: RelationshipsPort,
          useValue: { markBloquesCascadeInactive: jest.fn() },
        },
      ],
    })
      .overrideProvider(BloqueRepositoryPort)
      .useValue(createBloqueRepositoryMock())
      .compile();

    const cacheService = moduleRef.get(CacheService);
    const listUseCase = moduleRef.get(ListBloquesUseCase);
    const createUseCase = moduleRef.get(CreateBloqueUseCase);
    const updateUseCase = moduleRef.get(UpdateBloqueUseCase);
    const deleteUseCase = moduleRef.get(DeleteBloqueUseCase);

    expect(cacheService).toBeInstanceOf(CacheService);
    expect((listUseCase as any).cacheService).toBe(cacheService);
    expect((createUseCase as any).cacheService).toBe(cacheService);
    expect((updateUseCase as any).cacheService).toBe(cacheService);
    expect((deleteUseCase as any).cacheService).toBe(cacheService);
  });
});

import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CampusRepositoryPort } from '../domain/campus.repository.port';
import { CacheService } from '../../_shared/infrastructure/cache/cache.service';
import { CacheKeyBuilder } from '../../_shared/infrastructure/cache/cache-key-builder';

export type ListCampusInput = {
  skip?: number;
  take?: number;
  search?: string;
  orderBy?: 'nombre' | 'creado_en';
  direction?: 'asc' | 'desc';
  activo?: boolean;
};

@Injectable()
export class ListCampusUseCase {
  constructor(
    @Inject(CampusRepositoryPort) private readonly repo: CampusRepositoryPort,
    private readonly cacheService: CacheService,
    private readonly config: ConfigService,
  ) {}

  async execute(input: ListCampusInput) {
    const {
      skip = 0,
      take = 10,
      search,
      orderBy = 'creado_en',
      direction = 'asc',
      activo,
    } = input;

    const ttl = this.config.get<number>('CACHE_TTL', 300);
    const cacheKey = CacheKeyBuilder.list('campus', {
      skip,
      take,
      search,
      orderBy,
      direction,
      activo,
    });

    return this.cacheService.getOrSet(cacheKey, ttl, async () => {
      const { items, total } = await this.repo.list({
        skip,
        take,
        search,
        orderBy,
        direction,
        activo,
      });

      const page = Math.floor(skip / take) + 1;
      const pages = Math.max(1, Math.ceil(total / take));

      return {
        items,
        meta: {
          total,
          page,
          take,
          pages,
          hasNextPage: page < pages,
          hasPrevPage: page > 1,
        },
      };
    });
  }
}

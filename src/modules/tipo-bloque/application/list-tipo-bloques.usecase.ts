import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ListTipoBloquesOptions,
  ListTipoBloquesResult,
  TipoBloqueOrderBy,
  TipoBloqueOrderDir,
} from '../domain/tipo-bloque.list.types';
import { TipoBloqueRepositoryPort } from '../domain/tipo-bloque.repository.port';
import { CacheService } from '../../_shared/infrastructure/cache/cache.service';
import { CacheKeyBuilder } from '../../_shared/infrastructure/cache/cache-key-builder';

const ALLOWED_ORDER_BY: TipoBloqueOrderBy[] = [
  'nombre',
  'creado_en',
  'descripcion',
];
const ALLOWED_ORDER_DIR: TipoBloqueOrderDir[] = ['asc', 'desc'];

@Injectable()
export class ListTipoBloquesUseCase {
  constructor(
    @Inject(TipoBloqueRepositoryPort)
    private readonly repo: TipoBloqueRepositoryPort,
    private readonly cacheService: CacheService,
    private readonly config: ConfigService,
  ) {}

  async execute(input: {
    page?: number;
    limit?: number;
    search?: string | null;
    orderBy?: TipoBloqueOrderBy;
    orderDir?: TipoBloqueOrderDir;
    activo?: boolean;
  }): Promise<ListTipoBloquesResult> {
    const page = input.page ?? 1;
    const limit = input.limit ?? 6;
    const orderBy = input.orderBy ?? 'nombre';
    const orderDir = input.orderDir ?? 'asc';
    const search = input.search?.trim()?.length ? input.search.trim() : null;
    const activo = input.activo;

    const validationError = (field: string, message: string) => {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [{ field, message }],
      });
    };

    if (!Number.isInteger(page) || page < 1) {
      validationError(
        'page',
        'La pagina debe ser un numero entero mayor o igual a 1',
      );
    }

    if (!Number.isInteger(limit) || limit < 1) {
      validationError(
        'limit',
        'El limite debe ser un numero entero mayor o igual a 1',
      );
    }

    if (!ALLOWED_ORDER_BY.includes(orderBy)) {
      validationError(
        'orderBy',
        'Solo se puede ordenar por nombre, descripcion o creado_en',
      );
    }

    if (!ALLOWED_ORDER_DIR.includes(orderDir)) {
      validationError('orderDir', 'La direccion de orden debe ser asc o desc');
    }

    if (activo !== undefined && typeof activo !== 'boolean') {
      validationError('activo', 'El campo activo debe ser booleano');
    }

    const options: ListTipoBloquesOptions = {
      page,
      take: limit,
      search,
      orderBy,
      orderDir,
      activo,
    };

    const ttl = this.config.get<number>('CACHE_TTL', 300);
    const cacheKey = CacheKeyBuilder.list('tipo_bloque', {
      page,
      limit,
      orderBy,
      orderDir,
      search,
      activo,
    });

    return this.cacheService.getOrSet(cacheKey, ttl, () =>
      this.repo.list(options),
    );
  }
}

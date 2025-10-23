import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  ListTipoBloquesOptions,
  ListTipoBloquesResult,
  TipoBloqueOrderBy,
  TipoBloqueOrderDir,
} from '../domain/tipo-bloque.list.types';
import { TipoBloqueRepositoryPort } from '../domain/tipo-bloque.repository.port';

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
  ) {}

  async execute(input: {
    page?: number;
    limit?: number;
    search?: string;
    orderBy?: TipoBloqueOrderBy;
    orderDir?: TipoBloqueOrderDir;
  }): Promise<ListTipoBloquesResult> {
    const page = input.page ?? 1;
    const limit = input.limit ?? 8;
    const orderBy = input.orderBy ?? 'nombre';
    const orderDir = input.orderDir ?? 'asc';
    const search = input.search?.trim()?.length ? input.search.trim() : null;

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

    const options: ListTipoBloquesOptions = {
      page,
      take: limit,
      search,
      orderBy,
      orderDir,
    };

    return this.repo.list(options);
  }
}

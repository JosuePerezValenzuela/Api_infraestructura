import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import {
  BloqueListOrderBy,
  BloqueListOrderDir,
  ListBloquesOptions,
  ListBloquesResult,
} from '../domain/bloque.list.types';
import { BloqueRepositoryPort } from '../domain/bloque.repository.port';

const ALLOWED_ORDER_BY: BloqueListOrderBy[] = [
  'codigo',
  'nombre',
  'pisos',
  'activo',
  'creado_en',
];

const ALLOWED_ORDER_DIR: BloqueListOrderDir[] = ['asc', 'desc'];

@Injectable()
export class ListBloquesUseCase {
  constructor(
    @Inject(BloqueRepositoryPort) private readonly repo: BloqueRepositoryPort,
  ) {}

  async execute(input: {
    page?: number;
    limit?: number;
    search?: string | null;
    orderBy?: BloqueListOrderBy;
    orderDir?: BloqueListOrderDir;
    facultadId?: number | null;
    tipoBloqueId?: number | null;
    activo?: boolean | null;
    pisosMin?: number | null;
    pisosMax?: number | null;
  }): Promise<ListBloquesResult> {
    const page = input.page ?? 1;
    const limit = input.limit ?? 6;
    const orderBy = input.orderBy ?? 'nombre';
    const orderDir = input.orderDir ?? 'asc';
    const search =
      input.search && input.search.trim().length > 0
        ? input.search.trim()
        : null;
    const facultadId = input.facultadId ?? null;
    const tipoBloqueId = input.tipoBloqueId ?? null;
    const activo = input.activo ?? null;
    const pisosMin = input.pisosMin ?? null;
    const pisosMax = input.pisosMax ?? null;

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

    if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
      validationError(
        'limit',
        'El limite debe ser un numero entre 1 y 50 registros por pagina',
      );
    }

    if (!ALLOWED_ORDER_BY.includes(orderBy)) {
      validationError(
        'orderBy',
        'Solo puedes ordenar por codigo, nombre, pisos, activo o creado_en',
      );
    }

    if (!ALLOWED_ORDER_DIR.includes(orderDir)) {
      validationError(
        'OrderDir',
        'La direccion de orden solo puede ser asc o desc',
      );
    }

    if (facultadId !== null) {
      if (!Number.isInteger(facultadId) || facultadId < 1) {
        validationError(
          'facultadId',
          'La facultadId debe ser un numero entero positivo',
        );
      }
    }

    if (tipoBloqueId !== null) {
      if (!Number.isInteger(tipoBloqueId) || tipoBloqueId < 1) {
        validationError(
          'tipoBloqueId',
          'El tipoBloqueId debe ser un numero entero positivo',
        );
      }
    }

    if (activo !== null && typeof activo !== 'boolean') {
      validationError('activo', 'El campo activo debe ser verdadero o falso');
    }

    if (pisosMin !== null) {
      if (!Number.isInteger(pisosMin) || pisosMin < 1 || pisosMin > 99) {
        validationError(
          'pisosMin',
          'El pisosMin debe ser un entero entre 1 y 99 pisos',
        );
      }
    }

    if (pisosMax !== null) {
      if (!Number.isInteger(pisosMax) || pisosMax < 1 || pisosMax > 99) {
        validationError(
          'pisosMax',
          'El pisosMax debe ser un entero entre 1 y 99 pisos',
        );
      }
    }

    if (pisosMin !== null && pisosMax !== null && pisosMin > pisosMax) {
      validationError(
        'pisos',
        'El rango de pisos es invalido: pisosMin no puede ser mayor que pisosMax',
      );
    }

    const options: ListBloquesOptions = {
      page,
      take: limit,
      search,
      orderBy,
      orderDir,
      facultadId,
      tipoBloqueId,
      activo,
      pisosMin,
      pisosMax,
    };

    return this.repo.list(options);
  }
}

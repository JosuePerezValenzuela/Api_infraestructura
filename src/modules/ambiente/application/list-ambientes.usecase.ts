import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  AmbienteRepositoryPort,
  AmbienteRepositoryPort as AmbienteRepoToken,
} from '../domain/ambiente.repository.port';
import {
  AmbienteListOrderBy,
  AmbienteListOrderDir,
  ListAmbientesOptions,
  ListAmbientesResult,
} from '../domain/ambiente.list.types';

const ALLOWED_ORDER_BY: AmbienteListOrderBy[] = [
  'nombre',
  'codigo',
  'piso',
  'activo',
  'creado_en',
];

const ALLOWED_ORDER_DIR: AmbienteListOrderDir[] = ['asc', 'desc'];

@Injectable()
export class ListAmbientesUseCase {
  constructor(
    @Inject(AmbienteRepoToken)
    private readonly ambienteRepo: AmbienteRepositoryPort,
  ) {}

  async execute(input: {
    page?: number;
    limit?: number;
    search?: string | null;
    orderBy?: AmbienteListOrderBy;
    orderDir?: AmbienteListOrderDir;
    bloqueId?: number | null;
    campusId?: number | null;
    facultadId?: number | null;
    tipoAmbienteId?: number | null;
    activo?: boolean | null;
    clases?: boolean | null;
    pisoMin?: number | null;
    pisoMax?: number | null;
  }): Promise<ListAmbientesResult> {
    const page = input.page ?? 1;
    const limit = input.limit ?? 8;
    const rawSearch = input.search?.trim();
    const search = rawSearch && rawSearch.length ? rawSearch : null;
    const orderBy = input.orderBy ?? 'nombre';
    const orderDir = input.orderDir ?? 'asc';
    const bloqueId = input.bloqueId ?? null;
    const campusId = input.campusId ?? null;
    const facultadId = input.facultadId ?? null;
    const tipoAmbienteId = input.tipoAmbienteId ?? null;
    const activo = input.activo ?? null;
    const clases = input.clases ?? null;
    const pisoMin = input.pisoMin ?? null;
    const pisoMax = input.pisoMax ?? null;

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
        'Solo puedes ordenar por nombre, codigo, piso, activo o creado_en',
      );
    }

    if (!ALLOWED_ORDER_DIR.includes(orderDir)) {
      validationError('orderDir', 'Solo se acepta asc o desc');
    }

    if (bloqueId !== null) {
      if (!Number.isInteger(bloqueId) || bloqueId < 1) {
        validationError(
          'bloqueId',
          'El bloqueId debe ser un numero entero positivo',
        );
      }
    }

    if (facultadId !== null) {
      if (!Number.isInteger(facultadId) || facultadId < 1) {
        validationError(
          'facultadId',
          'La facultadId debe ser un numero entero positivo',
        );
      }
    }

    if (tipoAmbienteId !== null) {
      if (!Number.isInteger(tipoAmbienteId) || tipoAmbienteId < 1) {
        validationError(
          'tipoAmbienteId',
          'El tipoAmbienteId debe ser un numero entero positivo',
        );
      }
    }

    if (activo !== null && typeof activo !== 'boolean') {
      validationError('activo', 'El campo activo debe ser verdadero o falso');
    }

    if (clases !== null && typeof clases !== 'boolean') {
      validationError('clases', 'El campo clases debe ser verdadero o falso');
    }

    if (pisoMin !== null) {
      if (!Number.isInteger(pisoMin) || pisoMin < 0 || pisoMin > 200) {
        validationError('pisoMin', 'El pisoMin debe estar entre 0 y 200');
      }
    }

    if (pisoMax !== null) {
      if (!Number.isInteger(pisoMax) || pisoMax < 0 || pisoMax > 200) {
        validationError('pisoMax', 'El pisoMax debe estar entre 0 y 200');
      }
    }

    if (pisoMin !== null && pisoMax !== null && pisoMin > pisoMax) {
      validationError('piso', 'El pisoMin no puede ser mayor que pisoMax');
    }

    const options: ListAmbientesOptions = {
      page,
      take: limit,
      search,
      orderBy,
      orderDir,
      bloqueId,
      campusId,
      facultadId,
      tipoAmbienteId,
      activo,
      clases,
      pisoMin,
      pisoMax,
    };

    return this.ambienteRepo.list(options);
  }
}

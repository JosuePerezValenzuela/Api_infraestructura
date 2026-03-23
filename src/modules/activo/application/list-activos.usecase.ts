import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  ActivoRepositoryPort,
  ActivoRepositoryPort as ActivoRepoToken,
} from '../domain/activo.repository.port';
import {
  ActivoListOrderBy,
  ActivoListOrderDir,
  ListActivosOptions,
  ListActivosResult,
} from '../domain/activo.list.types';

// Este caso de uso se encarga de validar y normalizar los filtros de listado de activos.
// Los comentarios explican cada paso en lenguaje sencillo para quien recien comienza.
@Injectable()
export class ListActivosUseCase {
  constructor(
    @Inject(ActivoRepoToken)
    private readonly activoRepo: ActivoRepositoryPort,
  ) {}

  async execute(input: {
    page?: number;
    limit?: number;
    search?: string | null;
    orderBy?: ActivoListOrderBy;
    orderDir?: ActivoListOrderDir;
    ambienteId?: number | null;
  }): Promise<ListActivosResult> {
    // Asignamos valores por defecto cuando el cliente no envia filtros.
    const page = input.page ?? 1;
    const limit = input.limit ?? 8;
    const rawSearch = input.search?.trim();
    // Si el texto viene vacio o solo espacios, lo tratamos como null para no buscar nada.
    const search = rawSearch && rawSearch.length ? rawSearch : null;
    const orderBy = input.orderBy ?? 'nombre';
    const orderDir = input.orderDir ?? 'asc';
    // El ambienteId puede venir indefinido; aqui lo normalizamos a null para "sin filtro".
    const ambienteId = input.ambienteId ?? null;

    // Pequeña funcion util para construir el error de validacion con el formato acordado.
    const validationError = (field: string, message: string) => {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [{ field, message }],
      });
    };

    // page debe ser entero >= 1 para que la paginacion tenga sentido.
    if (!Number.isInteger(page) || page < 1) {
      validationError(
        'page',
        'La pagina debe ser un numero entero mayor o igual a 1',
      );
    }

    // limit controla cuantos registros devolvemos; acotamos a 1..50 para proteger el servidor.
    if (!Number.isInteger(limit) || limit < 1 || limit > 150) {
      validationError(
        'limit',
        'El limite debe ser un numero entre 1 y 50 registros por pagina',
      );
    }

    // Solo permitimos ordenar por columnas conocidas para evitar inyecciones o errores.
    const allowedOrderBy: ActivoListOrderBy[] = ['nia', 'nombre', 'creado_en'];
    if (!allowedOrderBy.includes(orderBy)) {
      validationError(
        'orderBy',
        'Solo puedes ordenar por nia, nombre o creado_en',
      );
    }

    // La direccion solo puede ser asc o desc.
    const allowedOrderDir: ActivoListOrderDir[] = ['asc', 'desc'];
    if (!allowedOrderDir.includes(orderDir)) {
      validationError('orderDir', 'Solo se acepta asc o desc');
    }

    // Si se envia ambienteId, debe ser entero positivo; null significa "sin filtro".
    if (ambienteId !== null) {
      if (!Number.isInteger(ambienteId) || ambienteId < 1) {
        validationError(
          'ambienteId',
          'El ambienteId debe ser un numero entero positivo',
        );
      }
    }

    // Con todos los datos validados, armamos las opciones que entiende el repositorio.
    const options: ListActivosOptions = {
      page,
      take: limit,
      search,
      orderBy,
      orderDir,
      ambienteId,
    };

    // Delegamos la consulta en el repositorio especializado en acceder a la base.
    return this.activoRepo.list(options);
  }
}

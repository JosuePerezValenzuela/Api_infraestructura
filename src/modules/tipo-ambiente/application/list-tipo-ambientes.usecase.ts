import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { TipoAmbienteRepositoryPort } from '../domain/tipo-ambiente.repository.port';
import {
  ListTipoAmbientesOptions,
  ListTipoAmbientesResult,
} from '../domain/tipo-ambiente.list.types';

@Injectable()
export class ListTipoAmbientesUseCase {
  constructor(
    @Inject(TipoAmbienteRepositoryPort)
    private readonly repo: TipoAmbienteRepositoryPort,
  ) {}

  async execute(input: {
    page?: number;
    limit?: number;
    search?: string | null;
    orderBy?: 'nombre' | 'creado_en';
    orderDir?: 'asc' | 'desc';
  }): Promise<ListTipoAmbientesResult> {
    const page = input.page ?? 1;
    const limit = input.limit ?? 8;
    const orderBy = input.orderBy ?? 'nombre';
    const orderDir = input.orderDir ?? 'asc';
    const search = input.search?.trim();

    this.ensurePageIsValid(page);
    this.ensureLimitIsValid(limit);
    this.ensureOrderByIsValid(orderBy);
    this.ensureOrderDirIsValid(orderDir);

    const options: ListTipoAmbientesOptions = {
      page,
      take: limit,
      search: search && search.length > 0 ? search : null,
      orderBy,
      orderDir,
    };

    return this.repo.list(options);
  }

  private ensurePageIsValid(page: number) {
    if (page < 1) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          { field: 'page', message: 'La pagina debe ser mayor o igual a 1' },
        ],
      });
    }
  }

  private ensureLimitIsValid(limit: number) {
    if (limit < 1 || limit > 50) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          {
            field: 'limit',
            message: 'El limite debe estar entre 1 y 50 registros',
          },
        ],
      });
    }
  }

  private ensureOrderByIsValid(orderBy: string) {
    const allowed = ['nombre', 'creado_en'];
    if (!allowed.includes(orderBy)) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          {
            field: 'orderBy',
            message: 'Solo puedes ordenar por nombre o creado_en',
          },
        ],
      });
    }
  }

  private ensureOrderDirIsValid(orderDir: string) {
    const allowed = ['asc', 'desc'];
    if (!allowed.includes(orderDir)) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          {
            field: 'orderDir',
            message: 'Solo se aceptan las direcciones asc o desc',
          },
        ],
      });
    }
  }
}

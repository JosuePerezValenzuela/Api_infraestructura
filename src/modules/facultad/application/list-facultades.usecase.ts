import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ListFacultadesQuery } from '../domain/facultad.list.types';
import { FacultadRepositoryPort } from '../domain/facultad.repository.port';
import { CacheService } from '../../_shared/infrastructure/cache/cache.service';
import { CacheKeyBuilder } from '../../_shared/infrastructure/cache/cache-key-builder';

@Injectable()
export class ListFacultadesUseCase {
  constructor(
    @Inject(FacultadRepositoryPort)
    private readonly facultadRepository: FacultadRepositoryPort,
    private readonly cacheService: CacheService,
    private readonly config: ConfigService,
  ) {}

  async execute(input: Partial<ListFacultadesQuery>) {
    // Extraemos los filtros solicitados; si alguno falta, usamos valores por defecto sencillos para que la lista arranque.
    const {
      page = 1,
      take = 8,
      search = null,
      orderBy = 'nombre',
      orderDir = 'asc',
      activo,
    } = input;

    // Definimos una lista de columnas permitidas para ordenar y evitar que alguien pida campos prohibidos que rompan la consulta.
    const allowedOrderBy: string[] = ['nombre', 'codigo', 'creado_en'];

    if (!allowedOrderBy.includes(orderBy)) {
      // Si la columna solicitada no esta en la lista, avisamos al consumidor que su peticion no es valida.
      const field: string = 'orderBy';
      const message: string = 'No se puede ordenar por este campo';
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [{ field, message }],
      });
    }

    // Construimos el objeto de consulta final con datos limpios listos para el repositorio.
    const query: ListFacultadesQuery = {
      page,
      take,
      search,
      orderBy,
      orderDir,
      activo,
    };

    // Cacheamos el resultado para evitar consultas repetitivas a la base de datos.
    const ttl = this.config.get<number>('CACHE_TTL', 300);
    const cacheKey = CacheKeyBuilder.list('facultad', {
      page,
      take,
      search,
      orderBy,
      orderDir,
      activo,
    });

    return this.cacheService.getOrSet(cacheKey, ttl, async () => {
      // Pedimos al repositorio que ejecute la busqueda paginada en la base de datos y nos devuelva el resultado.
      const resp = await this.facultadRepository.findPaginated(query);
      return resp;
    });
  }
}

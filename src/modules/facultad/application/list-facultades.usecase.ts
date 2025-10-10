import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ListFacultadesQuery } from '../domain/facultad.list.types';
import { FacultadRepositoryPort } from '../domain/facultad.repository.port';

@Injectable()
export class ListFacultadesUseCase {
  constructor(
    @Inject(FacultadRepositoryPort)
    private readonly facultadRepository: FacultadRepositoryPort,
  ) {}

  async execute(input: Partial<ListFacultadesQuery>) {
    const {
      page = 1,
      take = 8,
      search = null,
      orderBy = 'nombre',
      orderDir = 'asc',
    } = input;

    const allowedOrderBy: string[] = ['nombre', 'codigo', 'creado_en'];

    if (!allowedOrderBy.includes(orderBy)) {
      const field: string = 'orderBy';
      const message: Error = new Error('No se puede ordenar por este campo');
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [{ field, message }],
      });
    }

    const allowedOrderDir: string[] = ['asc', 'desc'];

    if (!allowedOrderDir.includes(orderDir)) {
      const field: string = 'orderDir';
      const message: Error = new Error('No se puede ordenar en esa direccion');
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [{ field, message }],
      });
    }

    const query: ListFacultadesQuery = {
      page,
      take,
      search,
      orderBy,
      orderDir,
    };
    //Ejecucion
    const resp = await this.facultadRepository.findPaginated(query);

    return resp;
  }
}

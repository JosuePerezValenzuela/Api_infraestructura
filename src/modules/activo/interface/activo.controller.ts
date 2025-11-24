import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ListActivosUseCase } from '../application/list-activos.usecase';
import { ListActivosQueryDto } from './dto/list-activos-query.dto';

@ApiTags('Activos')
@Controller('activos')
export class ActivoController {
  constructor(private readonly listActivosUseCase: ListActivosUseCase) {}

  @Get()
  @ApiOperation({
    summary: 'Listar activos',
    description:
      'Devuelve una tabla paginada de activos con filtros por ambiente y busqueda textual.',
  })
  @ApiOkResponse({
    description: 'Listado obtenido correctamente',
    schema: {
      example: {
        items: [
          {
            id: 1,
            nia: 'NIA-0001',
            nombre: 'Proyector Epson X12',
            descripcion: 'Proyector principal del auditorio central',
            creado_en: '2025-11-10T12:00:00.000Z',
            ambiente_id: 4,
            ambiente_nombre: 'Auditorio central',
            ambiente_codigo: 'AUD-001',
          },
        ],
        meta: {
          total: 1,
          page: 1,
          take: 8,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Filtros invalidos',
    schema: {
      example: {
        statusCode: 400,
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [{ field: 'page', message: 'La pagina debe ser >= 1' }],
      },
    },
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Numero de pagina (>= 1). Por defecto 1.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Cantidad de registros por pagina (1..50). Por defecto 8.',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Busqueda parcial por nia, nombre o descripcion.',
  })
  @ApiQuery({
    name: 'orderBy',
    required: false,
    enum: ['nia', 'nombre', 'creado_en'],
    description: 'Campo permitido para ordenar. Por defecto nombre.',
  })
  @ApiQuery({
    name: 'orderDir',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Direccion del ordenamiento. Por defecto asc.',
  })
  @ApiQuery({
    name: 'ambienteId',
    required: false,
    type: Number,
    description: 'Filtrar por ambiente especifico.',
  })
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() query: ListActivosQueryDto,
  ): Promise<ReturnType<ListActivosUseCase['execute']>> {
    // Pasamos los filtros tal cual al caso de uso; la validacion y defaults viven alli.
    return this.listActivosUseCase.execute({
      page: query.page,
      limit: query.limit,
      search: query.search,
      orderBy: query.orderBy,
      orderDir: query.orderDir,
      ambienteId: query.ambienteId,
    });
  }
}

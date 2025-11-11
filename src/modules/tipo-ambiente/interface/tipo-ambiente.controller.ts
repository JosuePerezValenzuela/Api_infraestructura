import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CreateTipoAmbienteUseCase } from '../application/create-tipo-ambiente.usecase';
import { CreateTipoAmbienteDto } from './dto/create-tipo-ambiente.dto';
import { ListTipoAmbientesUseCase } from '../application/list-tipo-ambientes.usecase';
import { ListTipoAmbientesQueryDto } from './dto/list-tipo-ambientes-query.dto';

@ApiTags('TipoAmbientes')
@ApiExtraModels(ListTipoAmbientesQueryDto)
@Controller('tipo_ambientes')
export class TipoAmbienteController {
  constructor(
    private readonly createTipoAmbienteUseCase: CreateTipoAmbienteUseCase,
    private readonly listTipoAmbientesUseCase: ListTipoAmbientesUseCase,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Crear un tipo de ambiente',
    description:
      'Registra un nuevo tipo de ambiente para clasificar los espacios físicos.',
  })
  @ApiCreatedResponse({
    description: 'Tipo de ambiente creado correctamente',
    schema: {
      example: { id: 42 },
    },
  })
  @ApiConflictResponse({
    description: 'Conflicto por nombre duplicado',
    schema: {
      example: {
        statusCode: 409,
        error: 'CONFLICT_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          {
            field: 'nombre',
            message: 'Ya existe un tipo de ambiente con ese nombre',
          },
        ],
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos',
    schema: {
      example: {
        statusCode: 400,
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          { field: 'nombre', message: 'El nombre no puede estar vacio' },
        ],
      },
    },
  })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateTipoAmbienteDto): Promise<{ id: number }> {
    return this.createTipoAmbienteUseCase.execute({
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      descripcion_corta: dto.descripcion_corta,
    });
  }

  @Get()
  @ApiOperation({
    summary: 'Listar tipos de ambiente',
    description:
      'Devuelve una tabla paginada con posibilidad de búsqueda y ordenamiento.',
  })
  @ApiOkResponse({
    description: 'Listado obtenido correctamente',
    schema: {
      example: {
        items: [
          {
            id: 1,
            nombre: 'Laboratorio',
            descripcion: 'Espacio científico',
            descripcion_corta: 'Lab',
            activo: true,
            creado_en: '2025-09-24T15:20:30.767Z',
            actualizado_en: '2025-09-24T15:25:30.767Z',
          },
        ],
        meta: {
          total: 1,
          page: 1,
          take: 8,
          pages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Filtros inválidos',
    schema: {
      example: {
        statusCode: 400,
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          { field: 'page', message: 'La página debe ser mayor o igual a 1' },
        ],
      },
    },
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página (>= 1). Por defecto 1.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Cantidad de registros por página (1..50). Por defecto 8.',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Búsqueda parcial por nombre.',
  })
  @ApiQuery({
    name: 'orderBy',
    required: false,
    enum: ['nombre', 'creado_en'],
    description: 'Campo permitido para ordenar. Por defecto nombre.',
  })
  @ApiQuery({
    name: 'orderDir',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Dirección del ordenamiento. Por defecto asc.',
  })
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() query: ListTipoAmbientesQueryDto,
  ): Promise<ReturnType<ListTipoAmbientesUseCase['execute']>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 8;
    const orderBy = query.orderBy ?? 'nombre';
    const orderDir = query.orderDir ?? 'asc';
    const search = query.search?.trim();

    return this.listTipoAmbientesUseCase.execute({
      page,
      limit,
      search: search && search.length > 0 ? search : null,
      orderBy,
      orderDir,
    });
  }
}

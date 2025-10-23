import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Get,
  Body,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateTipoBloqueUseCase } from '../application/create-tipo-bloque.usecase';
import { ListTipoBloquesUseCase } from '../application/list-tipo-bloques.usecase';
import { CreateTipoBloqueDto } from './dto/create-tipo-bloque.dto';
import { ListTipoBloquesQueryDto } from './dto/list-tipo-bloques-query.dto';
import {
  TipoBloqueOrderBy,
  TipoBloqueOrderDir,
} from '../domain/tipo-bloque.list.types';

@ApiTags('Tipo de Bloques')
@Controller('tipo_bloques')
export class TipoBloqueController {
  constructor(
    private readonly createTipoBloque: CreateTipoBloqueUseCase,
    private readonly listTipoBloquesUse: ListTipoBloquesUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listado paginado de tipos de bloque' })
  @ApiOkResponse({
    description: 'Tipos de bloque listados correctamente',
    schema: {
      example: {
        items: [
          {
            id: 1,
            nombre: 'Edificio de aulas',
            descripcion: 'Edificio exclusivo de aulas',
            activo: true,
            creado_en: '2025-09-24T15:20:30.767Z',
            actualizado_en: '2025-09-24T15:20:30.767Z',
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
    description: 'Filtros invalidos',
    schema: {
      example: {
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          {
            field: 'page',
            message: 'La pagina debe ser un numero mayor o igual a 1',
          },
        ],
      },
    },
  })
  async findAll(@Query() query: ListTipoBloquesQueryDto) {
    const filters = {
      page: query.page ?? 1,
      limit: query.limit ?? 8,
      search: query.search?.trim()?.length ? query.search.trim() : null,
      orderBy: (query.orderBy ?? 'nombre') as TipoBloqueOrderBy,
      orderDir: (query.orderDir ?? 'asc') as TipoBloqueOrderDir,
    };
    return this.listTipoBloquesUse.execute(filters);
  }
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un nuevo tipo de bloque' })
  @ApiBody({ type: CreateTipoBloqueDto })
  @ApiCreatedResponse({
    description: 'Tipo de bloque creado',
    schema: { example: { id: 1 } },
  })
  @ApiBadRequestResponse({
    description: 'Datos invalidos',
    schema: {
      example: {
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          { field: 'nombre', message: 'El nombre no puede estar vacio' },
        ],
      },
    },
  })
  @ApiConflictResponse({
    description: 'Nombre duplicado',
    schema: {
      example: {
        error: 'CONFLICT_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          {
            field: 'nombre',
            message: 'Ya existe un tipo de bloque con ese nombre',
          },
        ],
      },
    },
  })
  async create(@Body() dto: CreateTipoBloqueDto) {
    const { id } = await this.createTipoBloque.execute({
      nombre: dto.nombre,
      descripcion: dto.descripcion,
    });
    return { id };
  }
}

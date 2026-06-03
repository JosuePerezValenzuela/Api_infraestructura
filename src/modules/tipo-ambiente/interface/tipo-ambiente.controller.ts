import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CreateTipoAmbienteUseCase } from '../application/create-tipo-ambiente.usecase';
import { CreateTipoAmbienteDto } from './dto/create-tipo-ambiente.dto';
import { ListTipoAmbientesUseCase } from '../application/list-tipo-ambientes.usecase';
import { ListTipoAmbientesQueryDto } from './dto/list-tipo-ambientes-query.dto';
import { DeleteTipoAmbienteUseCase } from '../application/delete-tipo-ambiente.usecase';
import { UpdateTipoAmbienteUseCase } from '../application/update-tipo-ambiente.usecase';
import { UpdateTipoAmbienteDto } from './dto/update-tipo-ambiente.dto';

@ApiTags('TipoAmbientes')
@ApiExtraModels(ListTipoAmbientesQueryDto)
@Controller('tipo_ambientes')
export class TipoAmbienteController {
  constructor(
    private readonly createTipoAmbienteUseCase: CreateTipoAmbienteUseCase,
    private readonly listTipoAmbientesUseCase: ListTipoAmbientesUseCase,
    private readonly deleteTipoAmbienteUseCase: DeleteTipoAmbienteUseCase,
    private readonly updateTipoAmbienteUseCase: UpdateTipoAmbienteUseCase,
  ) {}

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
    description: 'Cantidad de registros por página (1..1000). Por defecto 8.',
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
  @ApiQuery({
    name: 'activo',
    required: false,
    type: Boolean,
    description: 'Filtra tipos de ambiente activos o inactivos.',
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
    const activo = query.activo;

    return this.listTipoAmbientesUseCase.execute({
      page,
      limit,
      search: search && search.length > 0 ? search : null,
      orderBy,
      orderDir,
      activo,
    });
  }

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

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar un tipo de ambiente',
    description: 'Permite modificar uno o varios campos del tipo de ambiente.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador del tipo de ambiente a actualizar',
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos',
    schema: {
      example: {
        statusCode: 400,
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          {
            field: 'payload',
            message: 'Debes enviar al menos un campo para actualizar',
          },
        ],
      },
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
  @ApiOkResponse({
    description: 'Tipo de ambiente actualizado correctamente',
    schema: { example: { id: 5 } },
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTipoAmbienteDto,
  ): Promise<{ id: number }> {
    return this.updateTipoAmbienteUseCase.execute({
      id: Number(id),
      ...dto,
    });
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar un tipo de ambiente',
    description:
      'Elimina un tipo de ambiente solo si no tiene ambientes asociados. Si hay ambientes dependientes, devuelve 409 Conflict.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador del tipo de ambiente a eliminar',
  })
  @ApiBadRequestResponse({
    description: 'Id invalido',
    schema: {
      example: {
        statusCode: 400,
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          { field: 'id', message: 'El id debe ser un número entero >= 1' },
        ],
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'El tipo de ambiente no existe',
    schema: {
      example: {
        statusCode: 404,
        error: 'NOT_FOUND',
        message: 'No se encontro el tipo de ambiente',
        details: [
          {
            field: 'id',
            message: 'El tipo de ambiente indicado no existe',
          },
        ],
      },
    },
  })
  @ApiConflictResponse({
    description: 'No se puede eliminar: hay ambientes asociados',
    schema: {
      example: {
        statusCode: 409,
        error: 'CONFLICT_ERROR',
        message: 'No se puede eliminar el tipo de ambiente',
        details: [
          {
            field: 'ambientes',
            message:
              'Ambiente "Aula 101" (AUL-101) depende de este tipo de ambiente',
            id: 1,
            codigo: 'AUL-101',
            nombre: 'Aula 101',
            activo: true,
          },
          {
            field: 'ambientes',
            message:
              'Ambiente "Laboratorio Q1" (LAB-Q1) depende de este tipo de ambiente',
            id: 2,
            codigo: 'LAB-Q1',
            nombre: 'Laboratorio Q1',
            activo: false,
          },
        ],
      },
    },
  })
  @ApiNoContentResponse({
    description: 'Tipo de ambiente eliminado correctamente',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.deleteTipoAmbienteUseCase.execute({ id });
  }
}

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
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateBloqueUseCase } from '../application/create-bloque.usecase';
import { CreateBloqueDto } from './dto/create-bloque.dto';
import { ListBloquesUseCase } from '../application/list-bloques.usecase';
import { ListBloquesQueryDto } from './dto/list-bloques-query.dto';
import {
  BloqueListOrderBy,
  BloqueListOrderDir,
} from '../domain/bloque.list.types';
import { UpdateBloqueUseCase } from '../application/update-bloque.usecase';
import { UpdateBloqueDto } from './dto/update-bloque.dto';
import { DeleteBloqueUseCase } from '../application/delete-bloque.usecase';

@ApiTags('Bloques')
@Controller('bloques')
export class BloqueController {
  constructor(
    private readonly createBloque: CreateBloqueUseCase,
    private readonly listBloques: ListBloquesUseCase,
    private readonly updateBloque: UpdateBloqueUseCase,
    private readonly deleteBloque: DeleteBloqueUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listado paginado de bloques' })
  @ApiOkResponse({
    description: 'Bloques listados correctamente',
    schema: {
      example: {
        items: [
          {
            id: 10,
            codigo: 'BLOQUE-101',
            nombre: 'Bloque Central',
            nombre_corto: 'Central',
            pisos: 4,
            activo: true,
            creado_en: '2025-10-01T12:00:00.000Z',
            facultad_nombre: 'Facultad Central',
            tipo_bloque_nombre: 'Académico',
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
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          {
            field: 'limit',
            message:
              'El limite debe ser un numero entre 1 y 50 registros por pagina',
          },
        ],
      },
    },
  })
  async findAll(@Query() query: ListBloquesQueryDto) {
    const filters = {
      page: query.page ?? 1,
      limit: query.limit ?? 8,
      search: query.search?.trim()?.length ? query.search.trim() : null,
      orderBy: (query.orderBy ?? 'nombre') as BloqueListOrderBy,
      orderDir: (query.orderDir ?? 'asc') as BloqueListOrderDir,
      facultadId: query.facultadId ?? null,
      tipoBloqueId: query.tipoBloqueId ?? null,
      activo: query.activo ?? null,
      pisosMin: query.pisosMin ?? null,
      pisosMax: query.pisosMax ?? null,
    };

    return this.listBloques.execute(filters);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un nuevo bloque' })
  @ApiBody({ type: CreateBloqueDto })
  @ApiCreatedResponse({
    description: 'Bloque creado correctamente',
    schema: { example: { id: 1 } },
  })
  @ApiBadRequestResponse({
    description: 'Datos invalidos o relaciones inexistentes',
    schema: {
      example: {
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          { field: 'facultad_id', message: 'La facultad indicada no existe' },
        ],
      },
    },
  })
  @ApiConflictResponse({
    description: 'Conflicto por codigo duplicado',
    schema: {
      example: {
        error: 'CONFLICT_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          {
            field: 'codigo',
            message: 'Ya existe un bloque con el mismo codigo',
          },
        ],
      },
    },
  })
  async create(@Body() dto: CreateBloqueDto) {
    const { id } = await this.createBloque.execute({
      codigo: dto.codigo,
      nombre: dto.nombre,
      nombre_corto: dto.nombre_corto ?? null,
      lat: dto.lat,
      lng: dto.lng,
      pisos: dto.pisos,
      activo: dto.activo,
      facultad_id: dto.facultad_id,
      tipo_bloque_id: dto.tipo_bloque_id,
    });

    return { id };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Editar parcialmente un bloque existente' })
  @ApiBody({ type: UpdateBloqueDto })
  @ApiOkResponse({
    description: 'Bloque actualizado correctamente',
    schema: { example: { id: 42 } },
  })
  @ApiBadRequestResponse({
    description: 'Datos invalidos o reglas de negocio incumplidas',
    schema: {
      example: {
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          {
            field: 'lat/lng',
            message: 'Debes enviar lat y lng juntos',
          },
        ],
      },
    },
  })
  @ApiConflictResponse({
    description: 'Conflicto por codigo duplicado',
    schema: {
      example: {
        error: 'CONFLICT',
        message: 'Ya existe un bloque con el mismo codigo',
        details: [
          {
            field: 'codigo',
            message: 'El codigo indicado ya esta en uso por otro bloque',
          },
        ],
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'No existe un bloque con el id indicado',
    schema: {
      example: {
        error: 'NOT_FOUND',
        message: 'No se encontro el bloque solicitado',
        details: [{ field: 'id', message: 'Bloque inexistente' }],
      },
    },
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBloqueDto,
  ) {
    const { id: updatedId } = await this.updateBloque.execute({
      id,
      input: { ...dto },
    });

    return { id: updatedId };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un bloque por identificador' })
  @ApiNoContentResponse({ description: 'Bloque eliminado correctamente' })
  @ApiNotFoundResponse({
    description: 'No existe un bloque con el id indicado',
    schema: {
      example: {
        error: 'NOT_FOUND',
        message: 'No se encontro el bloque',
      },
    },
  })
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.deleteBloque.execute({ id });
  }
}

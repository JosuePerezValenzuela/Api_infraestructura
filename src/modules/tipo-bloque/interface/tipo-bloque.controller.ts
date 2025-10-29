import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Get,
  Body,
  Query,
  Patch,
  Param,
  ParseIntPipe,
  Delete,
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
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CreateTipoBloqueUseCase } from '../application/create-tipo-bloque.usecase';
import { ListTipoBloquesUseCase } from '../application/list-tipo-bloques.usecase';
import { UpdateTipoBloqueUseCase } from '../application/update-tipo-bloque.usecase';
import { DeleteTipoBloqueUseCase } from '../application/delete-tipo-bloque.usecase';
import { CreateTipoBloqueDto } from './dto/create-tipo-bloque.dto';
import { ListTipoBloquesQueryDto } from './dto/list-tipo-bloques-query.dto';
import { UpdateTipoBloqueDto } from './dto/update-tipo-bloque.dto';
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
    private readonly updateTipoBloque: UpdateTipoBloqueUseCase,
    private readonly deleteTipoBloque: DeleteTipoBloqueUseCase,
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

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar un tipo de bloque' })
  @ApiBadRequestResponse({
    description: 'Datos inválidos o payload sin cambios',
    schema: {
      example: {
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          {
            field: 'descripcion',
            message:
              'La descripcion debe tener entre 1 y 256 caracteres cuando se envia',
          },
        ],
      },
    },
  })
  @ApiConflictResponse({
    description: 'Conflicto por nombre duplicado',
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
  @ApiNotFoundResponse({
    description: 'El tipo de bloque no existe',
    schema: {
      example: {
        error: 'NOT_FOUND',
        message: 'No se encontro el tipo de bloque',
        details: [
          {
            field: 'id',
            message: 'El tipo de bloque indicado no existe',
          },
        ],
      },
    },
  })
  @ApiOkResponse({
    description: 'Tipo de bloque actualizado correctamente',
    schema: {
      example: {
        id: 1,
      },
    },
  })
  @ApiBody({ type: UpdateTipoBloqueDto })
  @ApiParam({
    name: 'id',
    description: 'Identificador unico del tipo de bloque',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTipoBloqueDto,
  ) {
    const command = {
      id,
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      activo: dto.activo,
    };
    const { id: updatedId } = await this.updateTipoBloque.execute(command);
    return { id: updatedId };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un tipo de bloque' })
  @ApiParam({
    name: 'id',
    description: 'Identificador unico del tipo de bloque a eliminar',
  })
  @ApiNotFoundResponse({
    description: 'El tipo de bloque no existe',
    schema: {
      example: {
        error: 'NOT_FOUND',
        message: 'No se encontro el tipo de bloque',
        details: [
          {
            field: 'id',
            message: 'El tipo de bloque indicado no existe',
          },
        ],
      },
    },
  })
  @ApiNoContentResponse({
    description: 'Tipo de bloque eliminado correctametne',
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.deleteTipoBloque.execute({ id });
  }
}

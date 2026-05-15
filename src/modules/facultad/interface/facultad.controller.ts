import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  HttpException,
  ParseIntPipe,
  Post,
  Patch,
  Query,
  Param,
  Delete,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiBody,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { CreateFacultadUseCase } from '../application/create-facultad.usecase';
import { ListFacultadesUseCase } from '../application/list-facultades.usecase';
import { UpdateFacultadUseCase } from '../application/update-facultad.usecase';
import { DeleteFacultadUseCase } from '../application/delete-facultad.usecase';

import { CreateFacultadDto } from './dto/create-facultad.dto';
import { ListFacultadesQueryDto } from './dto/list-facultades-query.dto';
import { CreateFacultadCommand } from '../application/dto/create-facultad.command';
import { UpdateFacultadesDto } from './dto/update-facultad.dto';
import { DeleteFacultadCampusDto } from './dto/delete-facultad.dto';
import { BadRequestException } from '@nestjs/common';

@ApiTags('Facultades')
@Controller('facultades')
export class FacultadController {
  constructor(
    private readonly createFacultad: CreateFacultadUseCase,
    private readonly listFacultades: ListFacultadesUseCase,
    private readonly updateFacultad: UpdateFacultadUseCase,
    private readonly deleteFacultad: DeleteFacultadUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listado de las facultades' })
  @ApiOkResponse({
    description: 'Facultades listadas correctamente',
    schema: {
      example: {
        items: [
          {
            id: 10,
            codigo: '10',
            nombre: 'CIENCIAS AGRICOLAS Y PECUARIAS',
            nombre_corto: 'AGR',
            campus_ids: [3, 5],
            campuses: [
              { id: 3, nombre: 'Tamborada' },
              { id: 5, nombre: 'Temporal' },
            ],
            activo: true,
            creado_en: '2025-10-10T15:30:00.000Z',
          },
        ],
        meta: {
          total: 12,
          page: 1,
          take: 8,
          hasNextPage: true,
          hasPreviousPage: false,
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Filtros inválidos',
    schema: {
      example: {
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          { field: 'orderBy', message: 'No se puede ordenar por este campo' },
        ],
      },
    },
  })
  async findPaginated(@Query() query: ListFacultadesQueryDto) {
    const filters = {
      page: query.page ?? 1,
      take: query.limit ?? 8,
      search: query.search?.trim()?.length ? query.search.trim() : null,
      orderBy: query.orderBy ?? 'nombre',
      orderDir: query.orderDir ?? 'asc',
      activo: query.activo,
    };
    const result = await this.listFacultades.execute(filters);
    return result;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar una nueva facultad' })
  @ApiCreatedResponse({
    description: 'Facultad creada',
    schema: { example: { id: 16 } },
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos o relaciones inexistentes',
    schema: {
      example: {
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          { field: 'campus_ids', message: 'El campus con ID X no existe' },
        ],
      },
    },
  })
  @ApiBody({
    description: 'Datos para crear una facultad',
    schema: {
      example: {
        codigo: '30',
        nombre: 'FACULTAD DE NUEVA',
        nombre_corto: 'FVN',
        campus_ids: [1, 2],
      },
    },
  })
  async create(@Body() dto: CreateFacultadDto) {
    const command = new CreateFacultadCommand({
      codigo: dto.codigo,
      nombre: dto.nombre,
      nombre_corto: dto.nombre_corto ?? null,
      campus_ids: dto.campus_ids,
    });

    const { id } = await this.createFacultad.execute(command);

    return { id };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar una facultad' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({
    description: 'Datos para actualizar una facultad',
    schema: {
      example: {
        nombre: 'FACULTAD ACTUALIZADA',
        nombre_corto: 'FACT',
        activo: true,
        // Agregar/eliminar/reemplazar campuses
        // Ejemplo: eliminar campus 2, agregar campus 3
        campus_ids: [1, 3],
      },
    },
  })
  @ApiOkResponse({
    description: 'Facultad actualizada',
    schema: {
      example: {
        id: 3,
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos o relaciones inexistentes',
    schema: {
      example: {
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          { field: 'campus_ids', message: 'El campus con ID X no existe' },
        ],
      },
    },
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: UpdateFacultadesDto,
  ) {
    const resp = await this.updateFacultad.execute({ id, input });
    return { id: resp.id };
  }

  @Delete(':id/campus/:campusId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Elimina la relación específica entre una facultad y un campus (delete físico)' })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la facultad' })
  @ApiParam({ name: 'campusId', type: Number, description: 'ID del campus' })
  @ApiNoContentResponse({
    description: 'La relación entre la facultad y el campus fue eliminada físicamente',
  })
  @ApiNotFoundResponse({
    description: 'Facultad o campus no encontrado',
    schema: {
      example: {
        error: 'NOT_FOUND',
        message: 'No se encontro la facultad',
        details: [{ field: 'id', message: 'Facultad inexistente' }],
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'La relación entre la facultad y el campus no existe',
    schema: {
      example: {
        error: 'VALIDATION_ERROR',
        message: 'La relacion entre la facultad y el campus no existe',
        details: [
          {
            field: 'campusId',
            message: 'La facultad con ID 1 no esta relacionada con el campus con ID 5',
          },
        ],
      },
    },
  })
  @ApiConflictResponse({
    description: 'No se puede eliminar - hay bloques dependientes de esta relación',
    schema: {
      example: {
        error: 'CONFLICT_ERROR',
        message: 'No se puede eliminar la relacion porque hay bloques dependientes',
        details: [
          {
            field: 'bloques',
            message: 'Bloque "Edificio A" (EDIF-A) depende de esta relacion',
            block: {
              id: 1,
              codigo: 'EDIF-A',
              nombre: 'Edificio A',
              nombre_corto: 'EA',
              activo: true,
              campus_nombre: 'Campus Central',
            },
          },
          {
            field: 'bloques',
            message: 'Bloque "Laboratorio" (LAB-01) depende de esta relacion',
            block: {
              id: 2,
              codigo: 'LAB-01',
              nombre: 'Laboratorio',
              nombre_corto: 'LAB',
              activo: true,
              campus_nombre: 'Campus Central',
            },
          },
        ],
      },
    },
  })
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @Param('campusId', ParseIntPipe) campusId: number,
  ) {
    try {
      await this.deleteFacultad.execute({ id, campusId });
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw new HttpException(err.getResponse(), HttpStatus.NOT_FOUND);
      }
      if (err instanceof ConflictException) {
        throw new HttpException(err.getResponse(), HttpStatus.CONFLICT);
      }
      if (err instanceof BadRequestException) {
        throw new HttpException(err.getResponse(), HttpStatus.BAD_REQUEST);
      }
      throw new HttpException('Error interno', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

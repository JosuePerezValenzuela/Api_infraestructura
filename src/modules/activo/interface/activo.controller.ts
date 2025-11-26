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
  Put,
  Post,
  Query,
  Res,
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
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { ListActivosUseCase } from '../application/list-activos.usecase';
import { ListActivosQueryDto } from './dto/list-activos-query.dto';
import { CreateActivoUseCase } from '../application/create-activo.usecase';
import { CreateActivoDto } from './dto/create-activo.dto';
import { DeleteActivoUseCase } from '../application/delete-activo.usecase';
import { UpdateActivoUseCase } from '../application/update-activo.usecase';
import { UpdateActivoDto } from './dto/update-activo.dto';
import { AssignActivosToAmbienteUseCase } from '../application/assign-activos-to-ambiente.usecase';
import { AssignActivosDto } from './dto/assign-activos.dto';
import { UpsertActivoByNiaUseCase } from '../application/upsert-activo-by-nia.usecase';
import { UpsertActivoDto } from './dto/upsert-activo.dto';
import { GetActivoByNiaUseCase } from '../application/get-activo-by-nia.usecase';
import { GetActivoByNiaQueryDto } from './dto/get-activo-by-nia-query.dto';

@ApiTags('Activos')
@ApiExtraModels(AssignActivosDto)
@Controller('activos')
export class ActivoController {
  constructor(
    private readonly listActivosUseCase: ListActivosUseCase,
    private readonly createActivoUseCase: CreateActivoUseCase,
    private readonly deleteActivoUseCase: DeleteActivoUseCase,
    private readonly updateActivoUseCase: UpdateActivoUseCase,
    private readonly assignActivosToAmbienteUseCase: AssignActivosToAmbienteUseCase,
    private readonly upsertActivoByNiaUseCase: UpsertActivoByNiaUseCase,
    private readonly getActivoByNiaUseCase: GetActivoByNiaUseCase,
  ) {}

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

  @Post()
  @ApiOperation({
    summary: 'Crear un activo',
    description:
      'Registra un nuevo activo con su NIA, nombre, descripcion y ambiente opcional.',
  })
  @ApiCreatedResponse({
    description: 'Activo creado correctamente',
    schema: { example: { id: 7 } },
  })
  @ApiBadRequestResponse({
    description: 'Datos invalidos',
    schema: {
      example: {
        statusCode: 400,
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [{ field: 'nia', message: 'El NIA no puede estar vacio' }],
      },
    },
  })
  @ApiConflictResponse({
    description: 'NIA duplicado',
    schema: {
      example: {
        statusCode: 409,
        error: 'CONFLICT_ERROR',
        message: 'Los datos enviados no son validos',
        details: [{ field: 'nia', message: 'Ya existe un activo con ese NIA' }],
      },
    },
  })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateActivoDto,
  ): Promise<ReturnType<CreateActivoUseCase['execute']>> {
    // Delegamos la validacion y persistencia al caso de uso.
    return this.createActivoUseCase.execute(dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar un activo',
    description:
      'Permite modificar uno o varios campos de un activo existente.',
  })
  @ApiBadRequestResponse({
    description: 'Datos invalidos',
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
    description: 'NIA duplicado',
    schema: {
      example: {
        statusCode: 409,
        error: 'CONFLICT_ERROR',
        message: 'Los datos enviados no son validos',
        details: [{ field: 'nia', message: 'Ya existe un activo con ese NIA' }],
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Activo no existe',
    schema: {
      example: {
        statusCode: 404,
        error: 'NOT_FOUND',
        message: 'No se encontro el activo solicitado',
      },
    },
  })
  @ApiOkResponse({
    description: 'Activo actualizado correctamente',
    schema: { example: { id: 12 } },
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateActivoDto,
  ): Promise<ReturnType<UpdateActivoUseCase['execute']>> {
    return this.updateActivoUseCase.execute({
      id,
      ...dto,
    });
  }

  @Patch('ambientes/:ambienteId/activos')
  @ApiOperation({
    summary: 'Asociar varios activos a un ambiente',
    description:
      'Permite asignar en lote una lista de activos a un ambiente especifico.',
  })
  @ApiOkResponse({
    description: 'Activos asociados correctamente',
    schema: { example: { updatedIds: [1, 2, 3] } },
  })
  @ApiBadRequestResponse({
    description: 'Datos invalidos',
    schema: {
      example: {
        statusCode: 400,
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          {
            field: 'ambienteId',
            message: 'El ambienteId debe ser un entero >= 1',
          },
        ],
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Ambiente o activos inexistentes',
    schema: {
      example: {
        statusCode: 404,
        error: 'NOT_FOUND',
        message: 'Algunos activos no existen',
      },
    },
  })
  async assignActivosToAmbiente(
    @Param('ambienteId', ParseIntPipe) ambienteId: number,
    @Body() dto: AssignActivosDto,
  ): Promise<ReturnType<AssignActivosToAmbienteUseCase['execute']>> {
    return this.assignActivosToAmbienteUseCase.execute({
      ambienteId,
      activoIds: dto.activoIds,
    });
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar un activo',
    description: 'Elimina un activo existente por su identificador.',
  })
  @ApiNoContentResponse({ description: 'Activo eliminado correctamente' })
  @ApiBadRequestResponse({
    description: 'Id invalido',
    schema: {
      example: {
        statusCode: 400,
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          { field: 'id', message: 'El id debe ser un numero entero >= 1' },
        ],
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Activo no existe',
    schema: {
      example: {
        statusCode: 404,
        error: 'NOT_FOUND',
        message: 'No se encontro el activo solicitado',
      },
    },
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.deleteActivoUseCase.execute({ id });
  }

  @Put('nia/:nia')
  @ApiOperation({
    summary: 'Crear o actualizar un activo por NIA',
    description:
      'Si la NIA no existe, inserta un nuevo activo; si ya existe, actualiza solo los campos enviados.',
  })
  @ApiCreatedResponse({
    description: 'Activo creado con la NIA indicada',
    schema: { example: { nia: 'NIA-0009' } },
  })
  @ApiOkResponse({
    description: 'Activo actualizado con la NIA indicada',
    schema: { example: { nia: 'NIA-0009' } },
  })
  @ApiBadRequestResponse({
    description: 'Datos invalidos',
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
  @ApiNotFoundResponse({
    description: 'Ambiente no existe',
    schema: {
      example: {
        statusCode: 404,
        error: 'NOT_FOUND',
        message: 'No se encontro el ambiente solicitado',
      },
    },
  })
  async upsertByNia(
    @Param('nia') nia: string,
    @Body() dto: UpsertActivoDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ nia: string }> {
    // Delegamos la lógica de inserción/actualización al caso de uso.
    const result = await this.upsertActivoByNiaUseCase.execute({
      nia,
      ...dto,
    });

    // Ajustamos el status HTTP según si fue creación (201) o actualización (200).
    res.status(result.created ? HttpStatus.CREATED : HttpStatus.OK);

    return { nia: result.nia };
  }

  @Get('buscar_por_nia')
  @ApiOperation({
    summary: 'Buscar activo por NIA',
    description:
      'Devuelve los datos del activo y el nombre de su ambiente (si lo tiene) usando la NIA como clave.',
  })
  @ApiOkResponse({
    description: 'Activo encontrado',
    schema: {
      example: {
        id: 9,
        nia: 'NIA-0009',
        nombre: 'Laptop',
        descripcion: 'Equipo principal',
        ambiente_id: 4,
        ambiente_nombre: 'Aula Magna',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'NIA invalida',
    schema: {
      example: {
        statusCode: 400,
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [{ field: 'nia', message: 'El NIA no puede estar vacio' }],
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Activo no existe',
    schema: {
      example: {
        statusCode: 404,
        error: 'NOT_FOUND',
        message: 'No se encontro el activo solicitado',
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async getByNia(
    @Query() query: GetActivoByNiaQueryDto,
  ): Promise<
    ReturnType<GetActivoByNiaUseCase['execute']> extends Promise<infer R>
      ? R
      : never
  > {
    // Delegamos la búsqueda al caso de uso, que valida y trae datos del ambiente.
    return this.getActivoByNiaUseCase.execute({ nia: query.nia });
  }
}

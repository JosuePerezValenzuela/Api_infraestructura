/* eslint-disable indent */
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
  Put,
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
import { CreateAmbienteUseCase } from '../application/create-ambiente.usecase';
import { ListAmbientesUseCase } from '../application/list-ambientes.usecase';
import { ListAmbientesDisponiblesUseCase } from '../application/list-ambientes-disponibles.usecase';
import { ListAmbienteHorariosUseCase } from '../application/list-ambiente-horarios.usecase';
import { DeleteAmbienteUseCase } from '../application/delete-ambiente.usecase';
import { UpdateAmbienteUseCase } from '../application/update-ambiente.usecase';
import { ReplaceHorariosUseCase } from '../application/replace-horarios.usecase';
import { CreateAmbienteDto } from './dto/create-ambiente.dto';
import { ListAmbientesQueryDto } from './dto/list-ambientes-query.dto';
import { ListAmbientesDisponiblesQueryDto } from './dto/list-ambientes-disponibles-query.dto';
import { UpdateAmbienteDto } from './dto/update-ambiente.dto';
import { ReplaceHorariosDto } from './dto/replace-horarios.dto';

@ApiTags('Ambientes')
@Controller('ambientes')
export class AmbienteController {
  constructor(
    private readonly createAmbiente: CreateAmbienteUseCase,
    private readonly listAmbientes: ListAmbientesUseCase,
    private readonly listAmbientesDisponibles: ListAmbientesDisponiblesUseCase,
    private readonly listAmbienteHorarios: ListAmbienteHorariosUseCase,
    private readonly deleteAmbiente: DeleteAmbienteUseCase,
    private readonly updateAmbiente: UpdateAmbienteUseCase,
    private readonly replaceHorarios: ReplaceHorariosUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listado paginado de ambientes' })
  @ApiOkResponse({
    description: 'Respuesta paginada de ambientes',
    schema: {
      example: {
        items: [
          {
            id: 1,
            codigo: 'AULA-101',
            nombre: 'Aula principal',
            nombre_corto: '101',
            piso: 1,
            capacidad: { total: 40, examen: 25 },
            dimension: {
              largo: 8.5,
              ancho: 6,
              alto: 3.2,
              unid_med: 'metros',
            },
            clases: true,
            activo: true,
            bloque_nombre: 'Bloque Central',
            facultad_nombre: 'Facultad de Ingenieria',
            tipo_ambiente_nombre: 'Aula',
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
        details: [{ field: 'page', message: 'Debe ser un entero >= 1' }],
      },
    },
  })
  async findAll(@Query() query: ListAmbientesQueryDto) {
    const filters = {
      page: query.page,
      limit: query.limit,
      search: query.search,
      orderBy: query.orderBy,
      orderDir: query.orderDir,
      bloqueId: query.bloqueId,
      facultadId: query.facultadId,
      tipoAmbienteId: query.tipoAmbienteId,
      activo: query.activo,
      clases: query.clases,
      pisoMin: query.pisoMin,
      pisoMax: query.pisoMax,
    };

    return this.listAmbientes.execute(filters);
  }

  @Get('disponibles')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listado de ambientes disponibles con filtros' })
  @ApiOkResponse({
    description: 'Respuesta paginada de ambientes disponibles',
    schema: {
      example: {
        items: [
          {
            campus_id: 1,
            campus_nombre: 'Las cuadras',
            facultad_id: 1,
            facultad_nombre: 'Facultad de Ciencias y Tecnologia',
            bloque_id: 7,
            bloque_nombre: 'Departamento de Fisica',
            tipo_bloque_id: 1,
            tipo_bloque_nombre: 'Aulas',
            piso: 0,
            capacidad_examen_total: 130,
            capacidad_total: 170,
            ambientes: [
              {
                id: 45,
                codigo: 'FCyT-045',
                nombre: 'AULA 617B (IZQUIERDA)',
                nombre_corto: '617B',
                piso: 0,
                capacidad: { total: 90, examen: 70 },
                clases: true,
                activo: true,
                tipo_ambiente_id: 1,
                tipo_ambiente_nombre: 'Aula',
              },
              {
                id: 46,
                codigo: 'FCyT-046',
                nombre: 'AULA 617C (DERECHA)',
                nombre_corto: '617C',
                piso: 0,
                capacidad: { total: 80, examen: 60 },
                clases: true,
                activo: true,
                tipo_ambiente_id: 1,
                tipo_ambiente_nombre: 'Aula',
              },
            ],
          },
        ],
        meta: {
          total: 1,
          page: 1,
          take: 10,
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
        details: [{ field: 'capacidad_min', message: 'Debe ser >= 0' }],
      },
    },
  })
  async findDisponibles(@Query() query: ListAmbientesDisponiblesQueryDto) {
    return this.listAmbientesDisponibles.execute(query);
  }

  @Get(':id/horarios')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar horarios de un ambiente' })
  @ApiOkResponse({
    description: 'Listado de franjas horarias con metadatos',
    schema: {
      example: {
        hora_apertura: '07:00',
        hora_cierre: '21:00',
        periodo: 90,
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Ambiente no encontrado',
    schema: {
      example: {
        error: 'NOT_FOUND',
        message: 'No se encontro el ambiente solicitado',
      },
    },
  })
  async listHorarios(@Param('id', ParseIntPipe) id: number) {
    return this.listAmbienteHorarios.execute({ ambiente_id: id });
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar parcialmente un ambiente' })
  @ApiBody({ type: UpdateAmbienteDto })
  @ApiOkResponse({
    description: 'Ambiente actualizado',
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
    description: 'Conflicto por codigo duplicado',
    schema: {
      example: {
        error: 'CONFLICT_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          {
            field: 'codigo',
            message: 'Ya existe un ambiente con el mismo codigo',
          },
        ],
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Ambiente no encontrado',
    schema: {
      example: {
        error: 'NOT_FOUND',
        message: 'No se encontro el ambiente solicitado',
      },
    },
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAmbienteDto,
  ) {
    const result = await this.updateAmbiente.execute({ id, input: { ...dto } });
    return result;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un nuevo ambiente' })
  @ApiBody({ type: CreateAmbienteDto })
  @ApiCreatedResponse({
    description: 'Ambiente creado correctamente',
    schema: { example: { id: 1 } },
  })
  @ApiBadRequestResponse({
    description: 'Datos invalidos o relaciones inexistentes',
    schema: {
      example: {
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          { field: 'tipo_ambiente_id', message: 'El tipo indicado no existe' },
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
            message: 'Ya existe un ambiente con el mismo codigo',
          },
        ],
      },
    },
  })
  async create(@Body() dto: CreateAmbienteDto) {
    const { id } = await this.createAmbiente.execute({
      nombre: dto.nombre,
      nombre_corto: dto.nombre_corto ?? null,
      codigo: dto.codigo,
      piso: dto.piso,
      capacidad: dto.capacidad
        ? { total: dto.capacidad.total, examen: dto.capacidad.examen }
        : undefined,
      dimension: dto.dimension
        ? {
            largo: dto.dimension.largo,
            ancho: dto.dimension.ancho,
            alto: dto.dimension.alto,
            unid_med: dto.dimension.unid_med,
          }
        : undefined,
      clases: dto.clases,
      activo: dto.activo,
      tipo_ambiente_id: dto.tipo_ambiente_id,
      bloque_id: dto.bloque_id,
    });

    return { id };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un ambiente' })
  @ApiNoContentResponse({ description: 'Ambiente eliminado correctamente' })
  @ApiNotFoundResponse({
    description: 'No existe el ambiente',
    schema: {
      example: {
        error: 'NOT_FOUND',
        message: 'No se encontro el ambiente solicitado',
      },
    },
  })
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.deleteAmbiente.execute({ id });
  }

  @Put(':id/horarios')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reemplazar todas las franjas horarias de un ambiente',
  })
  @ApiBody({ type: ReplaceHorariosDto })
  @ApiOkResponse({
    description: 'Horarios actualizados',
    schema: { example: { ambiente_id: 1, total: 2 } },
  })
  @ApiBadRequestResponse({
    description: 'Datos invalidos o ambiente inactivo',
    schema: {
      example: {
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          {
            field: 'franjas',
            message: 'hora_inicio debe ser menor que hora_fin',
          },
        ],
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Ambiente no encontrado',
    schema: {
      example: {
        error: 'NOT_FOUND',
        message: 'No se encontro el ambiente solicitado',
      },
    },
  })
  @ApiConflictResponse({
    description: 'Traslape de franjas u otra restriccion de BD',
    schema: {
      example: {
        error: 'CONFLICT_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          {
            field: 'franjas',
            message: 'Las franjas se traslapan o violan una restriccion unica',
          },
        ],
      },
    },
  })
  async replaceHorariosHandler(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReplaceHorariosDto,
  ) {
    const result = await this.replaceHorarios.execute({
      ambiente_id: id,
      hora_apertura: dto.hora_apertura,
      hora_cierre: dto.hora_cierre,
      periodo: dto.periodo,
    });
    return result;
  }
}

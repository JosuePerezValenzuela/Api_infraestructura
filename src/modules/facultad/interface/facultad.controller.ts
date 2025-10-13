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
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateFacultadUseCase } from '../application/create-facultad.usecase';
import { ListFacultadesUseCase } from '../application/list-facultades.usecase';
import { CreateFacultadDto } from './dto/create-facultad.dto';
import { ListFacultadesQueryDto } from './dto/list-facultades-query.dto';
import { CreateFacultadCommand } from '../application/dto/create-facultad.command';

@ApiTags('Facultades')
@Controller('facultades')
export class FacultadController {
  constructor(
    private readonly createFacultad: CreateFacultadUseCase,
    private readonly listFacultades: ListFacultadesUseCase,
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
            id: 7,
            codigo: 'FCYT-01',
            nombre: 'Facultad de Ciencias y Tecnología',
            nombre_corto: 'FCyT',
            campus_nombre: 'Campus Central',
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
    };
    const result = await this.listFacultades.execute(filters);
    return result;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar una nueva facultad' })
  @ApiCreatedResponse({
    description: 'Facultad creada',
    schema: { example: { id: 1 } },
  })
  @ApiBadRequestResponse({
    description: 'Datos iinvalidos o relaciones inexistentes',
    schema: {
      example: {
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          { field: 'campus_id', message: 'El campus indicado no existe' },
        ],
      },
    },
  })
  async create(@Body() dto: CreateFacultadDto) {
    const command = new CreateFacultadCommand({
      codigo: dto.codigo,
      nombre: dto.nombre,
      nombre_corto: dto.nombre_corto ?? null,
      lat: dto.lat,
      lng: dto.lng,
      campus_id: dto.campus_id,
    });

    const { id } = await this.createFacultad.execute(command);

    return { id };
  }
}

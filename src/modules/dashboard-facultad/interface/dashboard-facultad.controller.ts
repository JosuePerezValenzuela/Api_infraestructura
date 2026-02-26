import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { GetFacultadDashboardDetailUseCase } from '../application/get-facultad-dashboard-detail.usecase';
import { GetFacultadDashboardGlobalUseCase } from '../application/get-facultad-dashboard-global.usecase';
import {
  DashboardFacultadDetailResult,
  DashboardFacultadGlobalResult,
} from '../domain/dashboard-facultad.types';
import { DashboardFacultadDetailQueryDto } from './dto/dashboard-facultad-detail.query.dto';
import { DashboardFacultadGlobalQueryDto } from './dto/dashboard-facultad-global.query.dto';
import { DashboardFacultadQueryMapper } from './mappers/dashboard-facultad-query.mapper';

@ApiTags('dashboards-facultades')
@Controller('dashboards/facultades')
export class DashboardFacultadController {
  // Creamos una instancia del mapper para centralizar parseo y validacion de query params.
  private readonly queryMapper = new DashboardFacultadQueryMapper();

  // Inyectamos los casos de uso para mantener el controlador enfocado en HTTP y delegacion.
  constructor(
    private readonly getGlobalDashboardUseCase: GetFacultadDashboardGlobalUseCase,
    private readonly getDetailDashboardUseCase: GetFacultadDashboardDetailUseCase,
  ) {}

  @Get('global')
  @ApiQuery({
    name: 'campusIds',
    required: false,
    description: 'Ids de campus separados por coma (ej: 1,2,3)',
    example: '1,2,3',
  })
  @ApiQuery({
    name: 'facultadIds',
    required: false,
    description: 'Ids de facultades separados por coma (ej: 10,11)',
    example: '10,11',
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    description: 'Indica si se incluyen registros inactivos (true por defecto)',
    type: Boolean,
    enum: ['true', 'false'],
    example: true,
    schema: { default: true },
  })
  @ApiQuery({
    name: 'slotMinutes',
    required: false,
    description: 'Tamano de slot para ocupacion (15,30,45,60). Default 45',
    example: 45,
    schema: { default: 45 },
  })
  @ApiQuery({
    name: 'dias',
    required: false,
    description:
      'Dias separados por coma (0=domingo ... 6=sabado). Default 0,1,2,3,4,5,6',
    example: '1,2,3,4,5',
  })
  @ApiOkResponse({
    description: 'Dashboard global de facultades con KPIs, charts y tablas',
  })
  @ApiBadRequestResponse({
    description: 'Datos invalidos',
    schema: {
      example: {
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [{ field: 'slotMinutes', message: 'Mensaje de validacion' }],
      },
    },
  })
  async getGlobalDashboard(
    @Query() query: DashboardFacultadGlobalQueryDto,
  ): Promise<DashboardFacultadGlobalResult> {
    // Convertimos los query params HTTP a filtros de dominio tipados y validados.
    const filters = this.queryMapper.toGlobalFilters(query);
    // Delegamos al caso de uso global para obtener la respuesta del dashboard.
    return this.getGlobalDashboardUseCase.execute(filters);
  }

  @Get(':facultadId')
  @ApiParam({
    name: 'facultadId',
    description: 'Identificador numerico de la facultad',
    example: 22,
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    description: 'Indica si se incluyen registros inactivos (true por defecto)',
    type: Boolean,
    enum: ['true', 'false'],
    example: true,
    schema: { default: true },
  })
  @ApiQuery({
    name: 'slotMinutes',
    required: false,
    description: 'Tamano de slot para ocupacion (15,30,45,60). Default 45',
    example: 45,
    schema: { default: 45 },
  })
  @ApiQuery({
    name: 'dias',
    required: false,
    description:
      'Dias separados por coma (0=domingo ... 6=sabado). Default 0,1,2,3,4,5,6',
    example: '1,2,3,4,5',
  })
  @ApiOkResponse({
    description: 'Dashboard detalle de una facultad con KPIs, charts y tablas',
  })
  @ApiBadRequestResponse({
    description: 'Datos invalidos',
    schema: {
      example: {
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [{ field: 'facultadId', message: 'Mensaje de validacion' }],
      },
    },
  })
  async getDetailDashboard(
    @Param('facultadId') facultadIdRaw: string,
    @Query() query: DashboardFacultadDetailQueryDto,
  ): Promise<DashboardFacultadDetailResult> {
    // Convertimos param + query a filtros de dominio para el caso de uso detalle.
    const filters = this.queryMapper.toDetailFilters(facultadIdRaw, query);
    // Delegamos al caso de uso detalle.
    return this.getDetailDashboardUseCase.execute(filters);
  }
}

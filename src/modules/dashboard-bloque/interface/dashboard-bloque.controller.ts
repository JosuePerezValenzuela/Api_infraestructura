import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { GetBloqueDashboardGlobalUseCase } from '../application/get-bloque-dashboard-global.usecase';
import { DashboardBloqueGlobalResult } from '../domain/dashboard-bloque.types';
import { DashboardBloqueGlobalQueryDto } from './dto/dashboard-bloque-global.query.dto';
import { DashboardBloqueQueryMapper } from './mappers/dashboard-bloque-query.mapper';

@ApiTags('dashboards-bloques')
@Controller('dashboards/bloques')
export class DashboardBloqueController {
  private readonly queryMapper = new DashboardBloqueQueryMapper();

  constructor(
    private readonly getGlobalDashboardUseCase: GetBloqueDashboardGlobalUseCase,
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
    name: 'bloqueIds',
    required: false,
    description: 'Ids de bloques separados por coma (ej: 100,101)',
    example: '100,101',
  })
  @ApiQuery({
    name: 'tipoBloqueIds',
    required: false,
    description: 'Ids de tipos de bloque separados por coma (ej: 1,2)',
    example: '1,2',
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
  @ApiOkResponse({
    description: 'Dashboard global de bloques con KPIs, charts y tablas',
    schema: {
      example: {
        schemaVersion: 2,
        filtersApplied: {
          campusIds: [1],
          facultadIds: [10],
          bloqueIds: [100, 101],
          tipoBloqueIds: [2],
          includeInactive: true,
        },
        layout: { mode: 'global' },
        data: {
          kpis: {
            campus: { activos: 1, inactivos: 0 },
            facultades: { activos: 2, inactivos: 0 },
            bloques: { activos: 8, inactivos: 1 },
            ambientes: { activos: 42, inactivos: 5 },
            capacidad: { total: 2200, examen: 1260 },
            activos: { asignados: 280, noAsignadosGlobal: 17 },
          },
          charts: {
            tiposBloque: [
              { tipoBloqueId: 2, tipoBloqueNombre: 'Academico', cantidad: 6 },
            ],
            ambientesPorBloque: [
              { bloqueId: 100, bloqueNombre: 'Bloque A', ambientes: 12 },
            ],
            capacidadPorBloque: [
              {
                bloqueId: 100,
                bloqueNombre: 'Bloque A',
                capacidadTotal: 540,
                capacidadExamen: 300,
              },
            ],
            activosPorBloque: [
              {
                bloqueId: 100,
                bloqueNombre: 'Bloque A',
                activosAsignados: 68,
              },
            ],
          },
          tables: {
            resumenBloques: [
              {
                bloqueId: 100,
                bloqueNombre: 'Bloque A',
                campusNombre: 'Campus Central',
                facultadNombre: 'Facultad de Ingenieria',
                tipoBloqueNombre: 'Academico',
                pisos: 4,
                activo: true,
                ambientes: 12,
                capacidadTotal: 540,
                capacidadExamen: 300,
                activosAsignados: 68,
              },
            ],
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Datos invalidos',
    schema: {
      example: {
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [{ field: 'bloqueIds', message: 'Mensaje de validacion' }],
      },
    },
  })
  async getGlobalDashboard(
    @Query() query: DashboardBloqueGlobalQueryDto,
  ): Promise<DashboardBloqueGlobalResult> {
    const filters = this.queryMapper.toGlobalFilters(query);
    return this.getGlobalDashboardUseCase.execute(filters);
  }
}

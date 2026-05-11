import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { GetBloqueDashboardDetailUseCase } from '../application/get-bloque-dashboard-detail.usecase';
import { DashboardBloqueDetailResult } from '../domain/dashboard-bloque.types';
import { DashboardBloqueDetailQueryDto } from './dto/dashboard-bloque-detail.query.dto';
import { DashboardBloqueQueryMapper } from './mappers/dashboard-bloque-query.mapper';

@ApiTags('dashboards-bloques')
@Controller('dashboards/bloques')
export class DashboardBloqueController {
  private readonly queryMapper = new DashboardBloqueQueryMapper();

  constructor(
    private readonly getDetailDashboardUseCase: GetBloqueDashboardDetailUseCase,
  ) {}

  @Get(':bloqueId')
  @ApiParam({
    name: 'bloqueId',
    description: 'Identificador numérico del bloque',
    example: 101,
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
    description: 'Dashboard detalle de un bloque con KPIs, charts y lista de ambientes',
    schema: {
      example: {
        schemaVersion: 2,
        filtersApplied: {
          bloqueId: 101,
          includeInactive: true,
        },
        layout: { mode: 'detail' },
        data: {
          bloque: {
            id: 101,
            nombre: 'Bloque A',
            nombreCorto: 'Bloque A',
            activo: true,
            pisos: 4,
            tipoBloqueId: 1,
            tipoBloqueNombre: 'Académico',
            facultadId: 22,
            facultadNombre: 'Facultad de Ingeniería',
            campusId: 1,
            campusNombre: 'Campus Central',
          },
          kpis: {
            ambientes: { total: 12, activos: 10, inactivos: 2 },
            capacidad: { total: 540, examen: 300 },
            activos: { asignados: 68, sinAsignarGlobal: 11 },
          },
          charts: {
            tiposAmbiente: [
              { tipo: 'Aula', cantidad: 8 },
              { tipo: 'Laboratorio', cantidad: 3 },
              { tipo: 'Auditorio', cantidad: 1 },
            ],
          },
          porAmbiente: [
            {
              id: 1001,
              nombre: 'Aula 101',
              piso: 1,
              capacidad: { total: 40, examen: 30 },
              tipoAmbiente: 'Aula',
              activos: { asignados: 5 },
            },
            {
              id: 1002,
              nombre: 'Laboratorio 1',
              piso: 2,
              capacidad: { total: 30, examen: 0 },
              tipoAmbiente: 'Laboratorio',
              activos: { asignados: 8 },
            },
          ],
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos',
    schema: {
      example: {
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son válidos',
        details: [{ field: 'bloqueId', message: 'El parámetro bloqueId debe ser un entero positivo' }],
      },
    },
  })
  async getDetailDashboard(
    @Param('bloqueId') bloqueIdRaw: string,
    @Query() query: DashboardBloqueDetailQueryDto,
  ): Promise<DashboardBloqueDetailResult> {
    const filters = this.queryMapper.toDetailFilters(bloqueIdRaw, query);
    const result = await this.getDetailDashboardUseCase.execute(filters);
    if (!result) {
      throw new NotFoundException({
        error: 'NOT_FOUND',
        message: `No se encontró el bloque con ID ${filters.bloqueId}`,
      });
    }
    return result;
  }
}
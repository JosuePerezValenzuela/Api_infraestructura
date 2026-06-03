import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { GetFacultadDashboardDetailUseCase } from '../application/get-facultad-dashboard-detail.usecase';
import { DashboardFacultadDetailResult } from '../domain/dashboard-facultad.types';
import { DashboardFacultadDetailQueryDto } from './dto/dashboard-facultad-detail.query.dto';
import { DashboardFacultadQueryMapper } from './mappers/dashboard-facultad-query.mapper';

@ApiTags('dashboards-facultades')
@Controller('dashboards/facultades')
export class DashboardFacultadController {
  private readonly queryMapper = new DashboardFacultadQueryMapper();

  constructor(
    private readonly getDetailDashboardUseCase: GetFacultadDashboardDetailUseCase,
  ) {}

  @Get(':facultadId')
  @ApiParam({
    name: 'facultadId',
    description: 'Identificador numérico de la facultad',
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
  @ApiOkResponse({
    description:
      'Dashboard detalle de una facultad con KPIs, rankings, distribuciones y lista de bloques',
    schema: {
      example: {
        schemaVersion: 2,
        filtersApplied: {
          facultadId: 22,
          includeInactive: true,
        },
        layout: { mode: 'detail' },
        data: {
          facultad: {
            id: 22,
            nombre: 'Facultad de Ingeniería',
            nombreCorto: 'FI',
            activo: true,
            campusId: 1,
            campusNombre: 'Campus Central',
          },
          kpis: {
            bloques: { total: 4, activos: 3, inactivos: 1 },
            ambientes: { total: 20, activos: 16, inactivos: 4 },
            capacidad: { total: 800, examen: 520 },
            activos: { asignados: 120, sinAsignarGlobal: 11 },
          },
          rankings: {
            porCantidadAmbientes: [
              { bloqueId: 102, nombre: 'Bloque B', cantidad: 11 },
              { bloqueId: 101, nombre: 'Bloque A', cantidad: 9 },
            ],
            porCapacidadTotal: [
              { bloqueId: 102, nombre: 'Bloque B', capacidad: 500 },
              { bloqueId: 101, nombre: 'Bloque A', capacidad: 300 },
            ],
          },
          distribuciones: {
            tiposAmbientePorBloque: [
              {
                nombre: 'Bloque A',
                cantidadTotal: 9,
                tipos: [
                  { tipo: 'Aula', cantidad: 6 },
                  { tipo: 'Laboratorio', cantidad: 3 },
                ],
              },
              {
                nombre: 'Bloque B',
                cantidadTotal: 11,
                tipos: [
                  { tipo: 'Aula', cantidad: 8 },
                  { tipo: 'Auditorio', cantidad: 3 },
                ],
              },
            ],
          },
          porBloque: [
            {
              id: 101,
              nombre: 'Bloque A',
              ambientes: 9,
              capacidad: { total: 300, examen: 180 },
              activos: { asignados: 60 },
            },
            {
              id: 102,
              nombre: 'Bloque B',
              ambientes: 11,
              capacidad: { total: 500, examen: 340 },
              activos: { asignados: 60 },
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
        details: [
          {
            field: 'facultadId',
            message: 'El parámetro facultadId debe ser un entero positivo',
          },
        ],
      },
    },
  })
  async getDetailDashboard(
    @Param('facultadId') facultadIdRaw: string,
    @Query() query: DashboardFacultadDetailQueryDto,
  ): Promise<DashboardFacultadDetailResult> {
    const filters = this.queryMapper.toDetailFilters(facultadIdRaw, query);
    return this.getDetailDashboardUseCase.execute(filters);
  }
}

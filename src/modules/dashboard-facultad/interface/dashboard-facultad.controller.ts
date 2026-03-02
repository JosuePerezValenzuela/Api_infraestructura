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
    schema: {
      example: {
        schemaVersion: 2,
        filtersApplied: {
          campusIds: [1],
          facultadIds: [10, 11],
          includeInactive: true,
          slotMinutes: 45,
          dias: [1, 2, 3, 4, 5],
        },
        layout: { mode: 'global' },
        data: {
          kpis: {
            facultades: { activos: 1, inactivos: 1 },
            bloques: { activos: 3, inactivos: 2 },
            ambientes: { activos: 7, inactivos: 5 },
            capacidad: { total: 420, examen: 260 },
            activos: { asignados: 70, noAsignadosGlobal: 7 },
          },
          charts: {
            tiposBloque: [
              { tipoBloqueId: 1, tipoBloqueNombre: 'Academico', cantidad: 4 },
            ],
            tiposAmbiente: [
              { tipoAmbienteId: 5, tipoAmbienteNombre: 'Aula', cantidad: 10 },
            ],
            capacidadPorBloque: [
              {
                bloqueId: 101,
                bloqueNombre: 'Bloque A',
                capacidadTotal: 250,
                capacidadExamen: 150,
              },
            ],
            activosPorBloque: [
              {
                bloqueId: 101,
                bloqueNombre: 'Bloque A',
                activosAsignados: 60,
              },
            ],
            ambientesActivosInactivosPorBloque: [
              {
                bloqueId: 101,
                bloqueNombre: 'Bloque A',
                activos: 7,
                inactivos: 1,
              },
            ],
            ocupacionHeatmapSemanal: [
              {
                dia: 1,
                franja: '08:00-08:45',
                slotsOcupados: 10,
                slotsTotales: 16,
                pctOcupacion: 62.5,
              },
            ],
            ocupacionPorBloque: [
              {
                bloqueId: 101,
                bloqueNombre: 'Bloque A',
                slotsOcupados: 40,
                slotsTotales: 64,
                pctOcupacion: 62.5,
              },
            ],
            topAmbientesUtilizacion: {
              sobrecargados: [
                {
                  ambienteId: 500,
                  ambienteNombre: 'Lab Redes',
                  bloqueNombre: 'Bloque A',
                  pctOcupacion: 95,
                  slotsOcupados: 19,
                  slotsTotales: 20,
                },
              ],
              subutilizados: [
                {
                  ambienteId: 501,
                  ambienteNombre: 'Aula 3',
                  bloqueNombre: 'Bloque A',
                  pctOcupacion: 8,
                  slotsOcupados: 2,
                  slotsTotales: 25,
                },
              ],
            },
          },
          tables: {
            resumenBloques: [
              {
                bloqueId: 101,
                bloqueNombre: 'Bloque A',
                facultadNombre: 'Facultad de Ingenieria',
                tipoBloqueNombre: 'Academico',
                pisos: 4,
                activo: true,
                ambientes: 9,
                tiposAmbiente: 3,
                capacidadTotal: 250,
                capacidadExamen: 150,
                activosAsignados: 60,
              },
            ],
            ambientesUtilizacion: [
              {
                ambienteId: 500,
                ambienteNombre: 'Lab Redes',
                bloqueNombre: 'Bloque A',
                slotsOcupados: 19,
                slotsTotales: 20,
                pctOcupacion: 95,
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
    schema: {
      example: {
        schemaVersion: 2,
        filtersApplied: {
          facultadId: 22,
          includeInactive: true,
          slotMinutes: 45,
          dias: [1, 2, 3, 4, 5],
        },
        layout: { mode: 'detail' },
        data: {
          facultad: {
            id: 22,
            nombre: 'Facultad de Ingenieria',
            nombreCorto: 'FI',
            activo: true,
            campusId: 1,
            campusNombre: 'Campus Central',
          },
          kpis: {
            facultades: { activos: 1, inactivos: 0 },
            bloques: { activos: 3, inactivos: 1 },
            ambientes: { activos: 16, inactivos: 4 },
            capacidad: { total: 800, examen: 520 },
            activos: { asignados: 120, noAsignadosGlobal: 11 },
          },
          charts: {
            tiposBloque: [
              { tipoBloqueId: 1, tipoBloqueNombre: 'Academico', cantidad: 3 },
            ],
            tiposAmbiente: [
              { tipoAmbienteId: 5, tipoAmbienteNombre: 'Aula', cantidad: 14 },
            ],
            capacidadPorBloque: [
              {
                bloqueId: 101,
                bloqueNombre: 'Bloque A',
                capacidadTotal: 300,
                capacidadExamen: 180,
              },
            ],
            activosPorBloque: [
              {
                bloqueId: 101,
                bloqueNombre: 'Bloque A',
                activosAsignados: 60,
              },
            ],
            ambientesActivosInactivosPorBloque: [
              {
                bloqueId: 101,
                bloqueNombre: 'Bloque A',
                activos: 8,
                inactivos: 1,
              },
            ],
            ocupacionHeatmapSemanal: [
              {
                dia: 1,
                franja: '08:00-08:45',
                slotsOcupados: 10,
                slotsTotales: 16,
                pctOcupacion: 62.5,
              },
            ],
            ocupacionPorBloque: [
              {
                bloqueId: 101,
                bloqueNombre: 'Bloque A',
                slotsOcupados: 40,
                slotsTotales: 64,
                pctOcupacion: 62.5,
              },
            ],
            topAmbientesUtilizacion: {
              sobrecargados: [
                {
                  ambienteId: 500,
                  ambienteNombre: 'Lab Redes',
                  bloqueNombre: 'Bloque A',
                  pctOcupacion: 95,
                  slotsOcupados: 19,
                  slotsTotales: 20,
                },
              ],
              subutilizados: [
                {
                  ambienteId: 501,
                  ambienteNombre: 'Aula 3',
                  bloqueNombre: 'Bloque A',
                  pctOcupacion: 8,
                  slotsOcupados: 2,
                  slotsTotales: 25,
                },
              ],
            },
          },
          tables: {
            resumenBloques: [
              {
                bloqueId: 101,
                bloqueNombre: 'Bloque A',
                facultadNombre: 'Facultad de Ingenieria',
                tipoBloqueNombre: 'Academico',
                pisos: 4,
                activo: true,
                ambientes: 9,
                tiposAmbiente: 3,
                capacidadTotal: 300,
                capacidadExamen: 180,
                activosAsignados: 60,
              },
            ],
            ambientesUtilizacion: [
              {
                ambienteId: 500,
                ambienteNombre: 'Lab Redes',
                bloqueNombre: 'Bloque A',
                slotsOcupados: 19,
                slotsTotales: 20,
                pctOcupacion: 95,
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

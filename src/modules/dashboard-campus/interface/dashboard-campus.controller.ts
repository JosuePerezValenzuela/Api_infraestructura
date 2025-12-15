import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { DashboardCampusGlobalQueryDto } from './dto/dashboard-campus-global.query.dto';
import { DashboardCampusDetailQueryDto } from './dto/dashboard-campus-detail.query.dto';
import {
  DashboardDetailResult,
  DashboardGlobalResult,
} from '../domain/dashboard-campus.types';
import { GetCampusDashboardGlobalUseCase } from '../application/get-campus-dashboard-global.usecase';
import { GetCampusDashboardDetailUseCase } from '../application/get-campus-dashboard-detail.usecase';

@ApiTags('dashboards-campus')
@Controller('dashboards/campus')
export class DashboardCampusController {
  // El constructor recibe los casos de uso para delegar la logica de negocio sin mezclarse con HTTP.
  constructor(
    private readonly getGlobalDashboardUseCase: GetCampusDashboardGlobalUseCase,
    private readonly getDetailDashboardUseCase: GetCampusDashboardDetailUseCase,
  ) {
    // Nest inyecta las dependencias automaticamente; no necesitamos logica adicional aqui.
  }

  @Get('global')
  @ApiQuery({
    name: 'campusIds',
    required: false,
    description: 'Ids de campus separados por coma (ej: 1,2,3)',
    example: '1,2,3',
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    description: 'Indica si se incluyen registros inactivos (true por defecto)',
    example: true,
  })
  @ApiOkResponse({
    description: 'Estructura placeholder del dashboard global',
    schema: {
      example: {
        schemaVersion: 1,
        filtersApplied: {
          campusIds: [1, 2],
          includeInactive: true,
        },
        layout: { mode: 'global' },
        data: {
          kpis: {},
          charts: {},
          table: { rows: [] },
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
        details: [
          {
            field: 'campusIds',
            message:
              'El parametro campusIds debe ser una lista de enteros separados por coma',
          },
        ],
      },
    },
  })
  async getGlobalDashboard(
    @Query() query: DashboardCampusGlobalQueryDto,
  ): Promise<DashboardGlobalResult> {
    // Convertimos el texto de campusIds (CSV) a un arreglo de enteros o undefined si no se envio.
    const campusIds = this.parseCampusIds(query.campusIds);
    // Convertimos includeInactive a boolean, usando true como valor por defecto cuando no viene.
    const includeInactive = this.parseIncludeInactive(query.includeInactive);
    // Llamamos al caso de uso con los filtros ya normalizados para obtener la respuesta placeholder.
    const result = await this.getGlobalDashboardUseCase.execute({
      campusIds,
      includeInactive,
    });
    // Devolvemos el payload tal cual para que el consumidor HTTP lo reciba.
    return result;
  }

  @Get(':campusId')
  @ApiParam({
    name: 'campusId',
    description: 'Identificador numerico del campus',
    example: 10,
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    description: 'Indica si se incluyen registros inactivos (true por defecto)',
    example: true,
  })
  @ApiOkResponse({
    description: 'Estructura placeholder del dashboard de detalle',
    schema: {
      example: {
        schemaVersion: 1,
        filtersApplied: {
          campusId: 10,
          includeInactive: true,
        },
        layout: { mode: 'detail' },
        data: {
          kpis: {},
          charts: {},
          tables: { facultades: { rows: [] } },
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
        details: [
          {
            field: 'campusId',
            message: 'El parametro campusId debe ser un entero positivo',
          },
        ],
      },
    },
  })
  async getDetailDashboard(
    @Param('campusId') campusIdRaw: string,
    @Query() query: DashboardCampusDetailQueryDto,
  ): Promise<DashboardDetailResult> {
    // Validamos y convertimos el parametro de ruta campusId a un numero entero positivo.
    const campusId = this.parseCampusId(campusIdRaw);
    // Normalizamos includeInactive a boolean, usando true como valor por defecto cuando no se envia.
    const includeInactive = this.parseIncludeInactive(query.includeInactive);
    // Pedimos al caso de uso la respuesta placeholder con los filtros ya normalizados.
    const result = await this.getDetailDashboardUseCase.execute({
      campusId,
      includeInactive,
    });
    // Retornamos el payload sin modificar.
    return result;
  }

  private parseCampusIds(
    rawCampusIds: string | undefined,
  ): number[] | undefined {
    // Si no se envio el parametro, devolvemos undefined para indicar que no hay filtro por campus.
    if (rawCampusIds === undefined || rawCampusIds === null) {
      return undefined;
    }
    // Si el dato no es una cadena, levantamos una excepcion de validacion con el formato esperado.
    if (typeof rawCampusIds !== 'string') {
      throw this.buildValidationException(
        'campusIds',
        'El parametro campusIds debe ser una lista de enteros separados por coma',
      );
    }
    // Dividimos el texto por comas y quitamos espacios al inicio o final.
    const parts = rawCampusIds.split(',').map((part) => part.trim());
    // Filtramos elementos vacios por si vinieron comas consecutivas o espacios sobrantes.
    const filtered = parts.filter((part) => part.length > 0);
    // Convertimos cada segmento en numero usando Number.
    const numbers = filtered.map((part) => Number(part));
    // Revisamos si alguno no es un entero positivo valido.
    const hasInvalid = numbers.some(
      (value) => Number.isNaN(value) || !Number.isInteger(value) || value <= 0,
    );
    // Si encontramos un valor invalido, lanzamos la excepcion de validacion con el mensaje claro.
    if (hasInvalid) {
      throw this.buildValidationException(
        'campusIds',
        'El parametro campusIds debe ser una lista de enteros separados por coma',
      );
    }
    // Si todo es valido, regresamos el arreglo de enteros.
    return numbers;
  }

  private parseIncludeInactive(
    rawIncludeInactive: string | boolean | undefined,
  ): boolean {
    // Si no se envio el parametro, usamos true por defecto porque la HU lo pide asi.
    if (rawIncludeInactive === undefined || rawIncludeInactive === null) {
      return true;
    }
    // Si ya viene como booleano, lo devolvemos directo.
    if (typeof rawIncludeInactive === 'boolean') {
      return rawIncludeInactive;
    }
    // Si viene como texto, lo normalizamos a minusculas para comparar valores conocidos.
    if (typeof rawIncludeInactive === 'string') {
      const normalized = rawIncludeInactive.toLowerCase();
      // Aceptamos "true" y "1" como valores verdaderos.
      if (normalized === 'true' || normalized === '1') {
        return true;
      }
      // Aceptamos "false" y "0" como valores falsos.
      if (normalized === 'false' || normalized === '0') {
        return false;
      }
    }
    // Si no coincide con ningun formato valido, lanzamos la excepcion de validacion.
    throw this.buildValidationException(
      'includeInactive',
      'El parametro includeInactive debe ser true o false',
    );
  }

  private parseCampusId(rawCampusId: string | number): number {
    // Convertimos el valor a numero usando Number para aceptar strings numericos.
    const campusId = Number(rawCampusId);
    // Verificamos que sea un entero positivo; de lo contrario arrojamos una excepcion de validacion.
    if (
      !Number.isInteger(campusId) ||
      Number.isNaN(campusId) ||
      campusId <= 0
    ) {
      throw this.buildValidationException(
        'campusId',
        'El parametro campusId debe ser un entero positivo',
      );
    }
    // Si es valido, devolvemos el numero ya normalizado.
    return campusId;
  }

  private buildValidationException(
    field: string,
    message: string,
  ): BadRequestException {
    // Armamos y devolvemos la excepcion de BadRequest con el formato estandar del proyecto.
    return new BadRequestException({
      error: 'VALIDATION_ERROR',
      message: 'Los datos enviados no son validos',
      details: [{ field, message }],
    });
  }
}

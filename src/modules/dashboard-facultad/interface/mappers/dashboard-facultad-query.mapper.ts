import { BadRequestException } from '@nestjs/common';
import { DashboardFacultadDetailQueryDto } from '../dto/dashboard-facultad-detail.query.dto';
import { DashboardFacultadGlobalQueryDto } from '../dto/dashboard-facultad-global.query.dto';
import {
  DashboardFacultadDetailFilters,
  DashboardFacultadGlobalFilters,
} from '../../domain/dashboard-facultad.types';

export class DashboardFacultadQueryMapper {
  // Este metodo convierte los query params del endpoint global en filtros tipados del dominio.
  toGlobalFilters(
    query: DashboardFacultadGlobalQueryDto,
  ): DashboardFacultadGlobalFilters {
    const campusIds = this.parsePositiveIntegerCsv(
      query.campusIds,
      'campusIds',
      'El parametro campusIds debe ser una lista de enteros separados por coma',
    );
    const facultadIds = this.parsePositiveIntegerCsv(
      query.facultadIds,
      'facultadIds',
      'El parametro facultadIds debe ser una lista de enteros separados por coma',
    );
    const includeInactive = this.parseIncludeInactive(query.includeInactive);

    return {
      campusIds,
      facultadIds,
      includeInactive,
    };
  }

  toDetailFilters(
    facultadIdRaw: string | number,
    query: DashboardFacultadDetailQueryDto,
  ): DashboardFacultadDetailFilters {
    const facultadId = this.parseFacultadId(facultadIdRaw);
    const includeInactive = this.parseIncludeInactive(query.includeInactive);

    return {
      facultadId,
      includeInactive,
    };
  }

  // Convierte un CSV de enteros positivos a arreglo; si no llega parametro, devuelve undefined.
  private parsePositiveIntegerCsv(
    raw: string | undefined,
    field: string,
    errorMessage: string,
  ): number[] | undefined {
    // Si no viene parametro, no aplicamos filtro y devolvemos undefined.
    if (raw === undefined || raw === null) {
      return undefined;
    }
    // Aseguramos que el dato sea string porque llega desde query params HTTP.
    if (typeof raw !== 'string') {
      throw this.buildValidationException(field, errorMessage);
    }
    // Partimos por coma y limpiamos espacios de cada segmento.
    const parts = raw.split(',').map((part) => part.trim());
    // Ignoramos segmentos vacios causados por comas repetidas.
    const filtered = parts.filter((part) => part.length > 0);
    // Convertimos cada segmento a numero.
    const numbers = filtered.map((part) => Number(part));
    // Detectamos valores no numericos, no enteros o no positivos.
    const hasInvalid = numbers.some(
      (value) => Number.isNaN(value) || !Number.isInteger(value) || value <= 0,
    );
    // Si algun valor no cumple, lanzamos error de validacion estandar.
    if (hasInvalid) {
      throw this.buildValidationException(field, errorMessage);
    }
    // Devolvemos la lista de enteros positivos ya normalizada.
    return numbers;
  }

  // Convierte includeInactive aceptando true/false o 1/0 en texto.
  private parseIncludeInactive(raw: string | boolean | undefined): boolean {
    // Si no se envia, usamos true por defecto.
    if (raw === undefined || raw === null) {
      return true;
    }
    // Si viene como boolean, lo devolvemos directo.
    if (typeof raw === 'boolean') {
      return raw;
    }
    // Si viene como string, normalizamos a minusculas para comparacion estable.
    if (typeof raw === 'string') {
      const normalized = raw.toLowerCase();
      // Valores verdaderos aceptados.
      if (normalized === 'true' || normalized === '1') {
        return true;
      }
      // Valores falsos aceptados.
      if (normalized === 'false' || normalized === '0') {
        return false;
      }
    }
    // Si no coincide con formatos validos, respondemos con error estandar.
    throw this.buildValidationException(
      'includeInactive',
      'El parametro includeInactive debe ser true o false',
    );
  }

  private parseFacultadId(raw: string | number): number {
    // Convertimos el valor para permitir strings numericos.
    const facultadId = Number(raw);
    // Validamos que sea entero, numerico y mayor que cero.
    if (
      !Number.isInteger(facultadId) ||
      Number.isNaN(facultadId) ||
      facultadId <= 0
    ) {
      throw this.buildValidationException(
        'facultadId',
        'El parametro facultadId debe ser un entero positivo',
      );
    }
    // Devolvemos el id validado.
    return facultadId;
  }

  // Construye la excepcion de validacion con el formato global definido por el proyecto.
  private buildValidationException(
    field: string,
    message: string,
  ): BadRequestException {
    // Retornamos BadRequestException con cuerpo uniforme para todos los errores de validacion.
    return new BadRequestException({
      error: 'VALIDATION_ERROR',
      message: 'Los datos enviados no son validos',
      details: [{ field, message }],
    });
  }
}

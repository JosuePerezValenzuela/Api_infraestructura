import { BadRequestException } from '@nestjs/common';
import { DashboardBloqueGlobalQueryDto } from '../dto/dashboard-bloque-global.query.dto';
import { DashboardBloqueGlobalFilters } from '../../domain/dashboard-bloque.types';

export class DashboardBloqueQueryMapper {
  toGlobalFilters(
    query: DashboardBloqueGlobalQueryDto,
  ): DashboardBloqueGlobalFilters {
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
    const bloqueIds = this.parsePositiveIntegerCsv(
      query.bloqueIds,
      'bloqueIds',
      'El parametro bloqueIds debe ser una lista de enteros separados por coma',
    );
    const tipoBloqueIds = this.parsePositiveIntegerCsv(
      query.tipoBloqueIds,
      'tipoBloqueIds',
      'El parametro tipoBloqueIds debe ser una lista de enteros separados por coma',
    );
    const includeInactive = this.parseIncludeInactive(query.includeInactive);

    return {
      campusIds,
      facultadIds,
      bloqueIds,
      tipoBloqueIds,
      includeInactive,
    };
  }

  private parsePositiveIntegerCsv(
    raw: string | undefined,
    field: string,
    errorMessage: string,
  ): number[] | undefined {
    if (raw === undefined || raw === null) {
      return undefined;
    }
    if (typeof raw !== 'string') {
      throw this.buildValidationException(field, errorMessage);
    }

    const parts = raw.split(',').map((part) => part.trim());
    const filtered = parts.filter((part) => part.length > 0);
    const numbers = filtered.map((part) => Number(part));
    const hasInvalid = numbers.some(
      (value) => Number.isNaN(value) || !Number.isInteger(value) || value <= 0,
    );

    if (hasInvalid) {
      throw this.buildValidationException(field, errorMessage);
    }

    return numbers;
  }

  private parseIncludeInactive(raw: string | boolean | undefined): boolean {
    if (raw === undefined || raw === null) {
      return true;
    }

    if (typeof raw === 'boolean') {
      return raw;
    }

    if (typeof raw === 'string') {
      const normalized = raw.toLowerCase();
      if (normalized === 'true' || normalized === '1') {
        return true;
      }
      if (normalized === 'false' || normalized === '0') {
        return false;
      }
    }

    throw this.buildValidationException(
      'includeInactive',
      'El parametro includeInactive debe ser true o false',
    );
  }

  private buildValidationException(
    field: string,
    message: string,
  ): BadRequestException {
    return new BadRequestException({
      error: 'VALIDATION_ERROR',
      message: 'Los datos enviados no son validos',
      details: [{ field, message }],
    });
  }
}

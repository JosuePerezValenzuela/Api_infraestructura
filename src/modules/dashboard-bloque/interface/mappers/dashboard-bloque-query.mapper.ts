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
    const slotMinutes = this.parseSlotMinutes(query.slotMinutes);
    const dias = this.parseDias(query.dias);

    return {
      campusIds,
      facultadIds,
      bloqueIds,
      tipoBloqueIds,
      includeInactive,
      slotMinutes,
      dias,
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

  private parseSlotMinutes(raw: string | undefined): number {
    if (raw === undefined || raw === null) {
      return 45;
    }

    if (typeof raw !== 'string') {
      throw this.buildValidationException(
        'slotMinutes',
        'El parametro slotMinutes debe ser uno de los valores permitidos: 15,30,45,60,90',
      );
    }

    const slotMinutes = Number(raw);

    if (![15, 30, 45, 60, 90].includes(slotMinutes)) {
      throw this.buildValidationException(
        'slotMinutes',
        'El parametro slotMinutes debe ser uno de los valores permitidos: 15,30,45,60,90',
      );
    }

    return slotMinutes;
  }

  private parseDias(raw: string | undefined): number[] {
    if (raw === undefined || raw === null) {
      return [0, 1, 2, 3, 4, 5, 6];
    }

    if (typeof raw !== 'string') {
      throw this.buildValidationException(
        'dias',
        'El parametro dias debe ser una lista de enteros entre 0 y 6 separados por coma',
      );
    }

    const parts = raw.split(',').map((part) => part.trim());
    const filtered = parts.filter((part) => part.length > 0);
    const dias = filtered.map((part) => Number(part));
    const hasInvalid = dias.some(
      (value) =>
        Number.isNaN(value) ||
        !Number.isInteger(value) ||
        value < 0 ||
        value > 6,
    );

    if (hasInvalid) {
      throw this.buildValidationException(
        'dias',
        'El parametro dias debe ser una lista de enteros entre 0 y 6 separados por coma',
      );
    }

    return dias;
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

import { BadRequestException } from '@nestjs/common';
import { DashboardBloqueDetailQueryDto } from '../dto/dashboard-bloque-detail.query.dto';
import { DashboardBloqueDetailFilters } from '../../domain/dashboard-bloque.types';

export class DashboardBloqueQueryMapper {
  toDetailFilters(
    bloqueIdRaw: string,
    query: DashboardBloqueDetailQueryDto,
  ): DashboardBloqueDetailFilters {
    const bloqueId = Number(bloqueIdRaw);
    if (Number.isNaN(bloqueId) || !Number.isInteger(bloqueId) || bloqueId <= 0) {
      throw this.buildValidationException(
        'bloqueId',
        'El parámetro bloqueId debe ser un entero positivo',
      );
    }

    const includeInactive = this.parseIncludeInactive(query.includeInactive);

    return {
      bloqueId,
      includeInactive,
    };
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
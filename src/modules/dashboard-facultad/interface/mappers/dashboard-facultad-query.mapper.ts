import { BadRequestException } from '@nestjs/common';
import { DashboardFacultadDetailQueryDto } from '../dto/dashboard-facultad-detail.query.dto';
import { DashboardFacultadDetailFilters } from '../../domain/dashboard-facultad.types';

export class DashboardFacultadQueryMapper {
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
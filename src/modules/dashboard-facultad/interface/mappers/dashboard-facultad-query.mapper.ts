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
    // Parseamos campusIds (CSV) o dejamos undefined cuando no se envia.
    const campusIds = this.parsePositiveIntegerCsv(
      query.campusIds,
      'campusIds',
      'El parametro campusIds debe ser una lista de enteros separados por coma',
    );
    // Parseamos facultadIds (CSV) o dejamos undefined cuando no se envia.
    const facultadIds = this.parsePositiveIntegerCsv(
      query.facultadIds,
      'facultadIds',
      'El parametro facultadIds debe ser una lista de enteros separados por coma',
    );
    // Parseamos includeInactive de forma estricta para evitar conversiones ambiguas.
    const includeInactive = this.parseIncludeInactive(query.includeInactive);
    // Parseamos slotMinutes con default 45 y catalogo permitido.
    const slotMinutes = this.parseSlotMinutes(query.slotMinutes);
    // Parseamos dias (CSV 0..6) con default semanal completo.
    const dias = this.parseDias(query.dias);

    // Retornamos el objeto final con tipos correctos para el caso de uso.
    return {
      campusIds,
      facultadIds,
      includeInactive,
      slotMinutes,
      dias,
    };
  }

  // Este metodo convierte el id de ruta + query params del endpoint detalle en filtros tipados.
  toDetailFilters(
    facultadIdRaw: string | number,
    query: DashboardFacultadDetailQueryDto,
  ): DashboardFacultadDetailFilters {
    // Parseamos el id de facultad validando que sea entero positivo.
    const facultadId = this.parseFacultadId(facultadIdRaw);
    // Parseamos includeInactive con default true.
    const includeInactive = this.parseIncludeInactive(query.includeInactive);
    // Parseamos slotMinutes con default 45.
    const slotMinutes = this.parseSlotMinutes(query.slotMinutes);
    // Parseamos dias con default 0..6.
    const dias = this.parseDias(query.dias);

    // Construimos y devolvemos los filtros para el caso de uso detalle.
    return {
      facultadId,
      includeInactive,
      slotMinutes,
      dias,
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

  // Convierte slotMinutes a entero permitido con default 45.
  private parseSlotMinutes(raw: string | undefined): number {
    // Si no se envia, usamos el default acordado.
    if (raw === undefined || raw === null) {
      return 45;
    }
    // Validamos formato string de query.
    if (typeof raw !== 'string') {
      throw this.buildValidationException(
        'slotMinutes',
        'El parametro slotMinutes debe ser uno de los valores permitidos: 15,30,45,60',
      );
    }
    // Convertimos a numero entero.
    const slotMinutes = Number(raw);
    // Verificamos el catalogo permitido.
    if (![15, 30, 45, 60].includes(slotMinutes)) {
      throw this.buildValidationException(
        'slotMinutes',
        'El parametro slotMinutes debe ser uno de los valores permitidos: 15,30,45,60',
      );
    }
    // Retornamos el valor validado.
    return slotMinutes;
  }

  // Convierte dias CSV a lista de enteros entre 0 y 6; default semanal completo.
  private parseDias(raw: string | undefined): number[] {
    // Default: todos los dias de la semana.
    if (raw === undefined || raw === null) {
      return [0, 1, 2, 3, 4, 5, 6];
    }
    // Validamos formato string.
    if (typeof raw !== 'string') {
      throw this.buildValidationException(
        'dias',
        'El parametro dias debe ser una lista de enteros entre 0 y 6 separados por coma',
      );
    }
    // Separa por comas y limpia espacios.
    const parts = raw.split(',').map((part) => part.trim());
    // Descarta posiciones vacias.
    const filtered = parts.filter((part) => part.length > 0);
    // Convierte a numeros.
    const dias = filtered.map((part) => Number(part));
    // Verifica que cada valor sea entero y este en el rango 0..6.
    const hasInvalid = dias.some(
      (value) =>
        Number.isNaN(value) ||
        !Number.isInteger(value) ||
        value < 0 ||
        value > 6,
    );
    // Si algun valor es invalido, lanzamos error estandar.
    if (hasInvalid) {
      throw this.buildValidationException(
        'dias',
        'El parametro dias debe ser una lista de enteros entre 0 y 6 separados por coma',
      );
    }
    // Retornamos la lista validada.
    return dias;
  }

  // Convierte el param de ruta facultadId a entero positivo.
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

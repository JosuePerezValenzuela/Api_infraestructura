import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  AmbientesDisponiblesRepositoryPort,
  AmbientesDisponiblesRepositoryPort as DisponiblesRepoToken,
} from '../domain/ambiente.disponibles.port';
import {
  ListAmbientesDisponiblesResult,
  ListAmbientesDisponiblesQuery,
} from '../domain/ambiente.disponibles.types';
import { HorarioSlot } from '../domain/horario.repository.port';

type ListAmbientesDisponiblesInput = ListAmbientesDisponiblesQuery & {
  dia?: number;
  hora_inicio?: string;
  hora_fin?: string;
};

@Injectable()
export class ListAmbientesDisponiblesUseCase {
  constructor(
    @Inject(DisponiblesRepoToken)
    private readonly disponiblesRepo: AmbientesDisponiblesRepositoryPort,
  ) {}

  async execute(
    input: ListAmbientesDisponiblesInput,
  ): Promise<ListAmbientesDisponiblesResult> {
    const query = this.validateAndBuildQuery(input);
    return this.disponiblesRepo.listDisponibles(query);
  }

  private validateAndBuildQuery(
    input: ListAmbientesDisponiblesInput,
  ): ListAmbientesDisponiblesQuery {
    const error = (field: string, message: string) => {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [{ field, message }],
      });
    };

    const capacidad_min =
      input.capacidad_min !== undefined
        ? Number(input.capacidad_min)
        : undefined;
    if (
      capacidad_min !== undefined &&
      (!Number.isInteger(capacidad_min) || capacidad_min < 0)
    ) {
      error('capacidad_min', 'Debe ser un entero mayor o igual a 0');
    }

    const capacidad_examen_min =
      input.capacidad_examen_min !== undefined
        ? Number(input.capacidad_examen_min)
        : undefined;
    if (
      capacidad_examen_min !== undefined &&
      (!Number.isInteger(capacidad_examen_min) || capacidad_examen_min < 0)
    ) {
      error('capacidad_examen_min', 'Debe ser un entero mayor o igual a 0');
    }

    const mismo_piso = input.mismo_piso;

    const horario = this.buildHorario(
      {
        dia: input.dia,
        hora_inicio: input.hora_inicio,
        hora_fin: input.hora_fin,
      },
      error,
    );

    const tipo_ambiente_ids = this.validateIdsArray(
      input.tipo_ambiente_ids,
      'tipo_ambiente_ids',
      error,
    );
    const campus_ids = this.validateIdsArray(
      input.campus_ids,
      'campus_ids',
      error,
    );
    const facultad_ids = this.validateIdsArray(
      input.facultad_ids,
      'facultad_ids',
      error,
    );
    const bloque_ids = this.validateIdsArray(
      input.bloque_ids,
      'bloque_ids',
      error,
    );
    const tipo_bloque_ids = this.validateIdsArray(
      input.tipo_bloque_ids,
      'tipo_bloque_ids',
      error,
    );

    const page = input.page ?? 1;
    const take = input.take ?? 10;
    if (!Number.isInteger(page) || page < 1) {
      error('page', 'Debe ser un entero mayor o igual a 1');
    }
    if (!Number.isInteger(take) || take < 1 || take > 1000) {
      error('take', 'Debe ser un entero entre 1 y 1000');
    }

    const orderBy = input.orderBy ?? 'nombre';
    const orderDir = input.orderDir ?? 'asc';
    const allowedOrderBy = [
      'nombre',
      'codigo',
      'piso',
      'capacidad_examen_total',
      'capacidad_total',
    ];
    if (!allowedOrderBy.includes(orderBy)) {
      error(
        'orderBy',
        'Solo se permite nombre, codigo, piso, capacidad_examen_total o capacidad_total',
      );
    }
    if (!['asc', 'desc'].includes(orderDir)) {
      error('orderDir', 'Solo se permite asc o desc');
    }

    return {
      capacidad_min,
      capacidad_examen_min,
      mismo_piso,
      tipo_ambiente_ids,
      campus_ids,
      facultad_ids,
      bloque_ids,
      tipo_bloque_ids,
      horario,
      page,
      take,
      orderBy,
      orderDir,
    };
  }

  private buildHorario(
    input: { dia?: number; hora_inicio?: string; hora_fin?: string },
    error: (field: string, message: string) => never,
  ): HorarioSlot | undefined {
    const hasDia = input?.dia !== undefined;
    const hasHora =
      input?.hora_inicio !== undefined || input?.hora_fin !== undefined;

    if (hasHora && !hasDia) {
      error('dia', 'Debes enviar dia junto con hora_inicio y hora_fin');
    }
    if (!hasHora && hasDia) {
      error('hora', 'Debes enviar hora_inicio y hora_fin junto con dia');
    }
    if (!hasHora && !hasDia) {
      return undefined;
    }

    const dia = Number(input.dia);
    if (!Number.isInteger(dia) || dia < 0 || dia > 6) {
      error('dia', 'Debe estar entre 0 y 6');
    }

    const hora_inicio = String(input.hora_inicio);
    const hora_fin = String(input.hora_fin);
    const regex = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
    if (!regex.test(hora_inicio) || !regex.test(hora_fin)) {
      error('hora', 'hora_inicio y hora_fin deben tener formato HH:mm');
    }

    if (!this.isStartBeforeEnd(hora_inicio, hora_fin)) {
      error('hora', 'hora_inicio debe ser menor que hora_fin');
    }

    return { dia: dia as 0 | 1 | 2 | 3 | 4 | 5 | 6, hora_inicio, hora_fin };
  }

  private validateIdsArray(
    value: unknown,
    field: string,
    error: (field: string, message: string) => never,
  ): number[] | undefined {
    if (value === undefined) return undefined;
    if (!Array.isArray(value) || value.length === 0) {
      error(field, 'Debe ser un arreglo no vacio de enteros positivos');
    }
    const parsed = value.map((v) => Number(v));
    if (parsed.some((n) => !Number.isInteger(n) || n <= 0)) {
      error(field, 'Todos los ids deben ser enteros positivos');
    }
    return parsed;
  }

  private isStartBeforeEnd(hora_inicio: string, hora_fin: string): boolean {
    const toMinutes = (time: string) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };
    return toMinutes(hora_inicio) < toMinutes(hora_fin);
  }
}

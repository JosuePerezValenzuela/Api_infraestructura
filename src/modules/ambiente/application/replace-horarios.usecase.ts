import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  HorarioRepositoryPort,
  HorarioRepositoryPort as HorarioRepoToken,
  HorarioSlot,
  ReplaceHorariosCommand,
} from '../domain/horario.repository.port';
import {
  AmbienteRepositoryPort,
  AmbienteRepositoryPort as AmbienteRepoToken,
} from '../domain/ambiente.repository.port';
import { UpdateAmbienteCommand } from '../domain/commands/update-ambiente.command';

@Injectable()
export class ReplaceHorariosUseCase {
  constructor(
    @Inject(HorarioRepoToken)
    private readonly horarioRepo: HorarioRepositoryPort,
    @Inject(AmbienteRepoToken)
    private readonly ambienteRepo: AmbienteRepositoryPort,
  ) {}

  async execute(input: {
    ambiente_id: number;
    franjas: HorarioSlot[];
    hora_apertura?: string | null;
    hora_cierre?: string | null;
    periodo?: number | null;
  }): Promise<{ ambiente_id: number; total: number }> {
    const ambiente = await this.ambienteRepo.findById(input.ambiente_id);
    if (!ambiente) {
      throw new NotFoundException({
        error: 'NOT_FOUND',
        message: 'No se encontro el ambiente solicitado',
      });
    }

    if (ambiente.activo === false) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          {
            field: 'ambiente_id',
            message: 'No se pueden gestionar horarios de un ambiente inactivo',
          },
        ],
      });
    }

    // Normalizamos y validamos los nuevos metadatos horarios si fueron enviados.
    const horaApertura = this.validateOptionalTime(
      'hora_apertura',
      input.hora_apertura,
    );
    const horaCierre = this.validateOptionalTime(
      'hora_cierre',
      input.hora_cierre,
    );
    const periodo = this.validateOptionalPeriodo(input.periodo);

    if (
      horaApertura !== undefined &&
      horaCierre !== undefined &&
      horaApertura !== null &&
      horaCierre !== null &&
      !this.isStartBeforeEnd(horaApertura, horaCierre)
    ) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          {
            field: 'hora_apertura',
            message: 'hora_apertura debe ser menor que hora_cierre',
          },
        ],
      });
    }

    const mustUpdateAmbiente =
      horaApertura !== undefined ||
      horaCierre !== undefined ||
      periodo !== undefined;

    if (mustUpdateAmbiente) {
      const updateCommand: UpdateAmbienteCommand = {
        id: input.ambiente_id,
      };

      if (horaApertura !== undefined) {
        // Si el cliente mando un valor o null, lo reflejamos en la BD.
        updateCommand.hora_apertura = horaApertura;
      }

      if (horaCierre !== undefined) {
        // Solo tocamos la columna si se envio en la peticion.
        updateCommand.hora_cierre = horaCierre;
      }

      if (periodo !== undefined) {
        // Guardamos el periodo en minutos o lo limpiamos con null.
        updateCommand.periodo = periodo;
      }

      await this.ambienteRepo.update(updateCommand);
    }

    const franjas = input.franjas.map((slot) => this.validateSlot(slot));

    const command: ReplaceHorariosCommand = {
      ambiente_id: input.ambiente_id,
      franjas,
    };

    return this.horarioRepo.replaceForAmbiente(command);
  }

  private validateSlot(slot: HorarioSlot): HorarioSlot {
    const { dia, hora_inicio, hora_fin } = slot;

    if (!Number.isInteger(dia) || dia < 0 || dia > 6) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          {
            field: 'dia',
            message: 'dia debe estar entre 0 (lunes) y 6 (domingo)',
          },
        ],
      });
    }

    if (!this.isValidTime(hora_inicio) || !this.isValidTime(hora_fin)) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          { field: 'hora', message: 'Las horas deben estar en formato HH:mm' },
        ],
      });
    }

    if (!this.isStartBeforeEnd(hora_inicio, hora_fin)) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          {
            field: 'hora',
            message: 'hora_inicio debe ser menor que hora_fin',
          },
        ],
      });
    }

    return { dia: dia as 0 | 1 | 2 | 3 | 4 | 5 | 6, hora_inicio, hora_fin };
  }

  private validateOptionalTime(
    field: 'hora_apertura' | 'hora_cierre',
    value: string | null | undefined,
  ): string | null | undefined {
    // Si el cliente no envio el campo, devolvemos undefined para no tocarlo.
    if (value === undefined) {
      return undefined;
    }

    // Si explicitamente lo envio en null, permitimos limpiar el valor en BD.
    if (value === null) {
      return null;
    }

    // En cualquier otro caso debe cumplir formato HH:mm.
    if (!this.isValidTime(value)) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          {
            field,
            message: 'Debe tener formato HH:mm',
          },
        ],
      });
    }

    return value;
  }

  private validateOptionalPeriodo(
    value: number | null | undefined,
  ): number | null | undefined {
    // Si no se envio, no lo tocamos.
    if (value === undefined) {
      return undefined;
    }

    // Permitimos limpiar el campo con null.
    if (value === null) {
      return null;
    }

    // Debe ser un entero positivo para representar minutos de bloque.
    if (!Number.isInteger(value) || value < 1) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          {
            field: 'periodo',
            message: 'periodo debe ser un entero positivo',
          },
        ],
      });
    }

    return value;
  }

  private isValidTime(value: string): boolean {
    // Formato HH:mm de 00:00 a 23:59
    const regex = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
    return typeof value === 'string' && regex.test(value);
  }

  private isStartBeforeEnd(hora_inicio: string, hora_fin: string): boolean {
    const toMinutes = (time: string) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };
    return toMinutes(hora_inicio) < toMinutes(hora_fin);
  }
}

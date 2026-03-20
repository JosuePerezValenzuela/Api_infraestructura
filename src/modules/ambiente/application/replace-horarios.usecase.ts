import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AmbienteRepositoryPort,
  AmbienteRepositoryPort as AmbienteRepoToken,
} from '../domain/ambiente.repository.port';
import { UpdateAmbienteCommand } from '../domain/commands/update-ambiente.command';

@Injectable()
export class ReplaceHorariosUseCase {
  constructor(
    @Inject(AmbienteRepoToken)
    private readonly ambienteRepo: AmbienteRepositoryPort,
  ) {}

  async execute(input: {
    ambiente_id: number;
    hora_apertura?: string | null;
    hora_cierre?: string | null;
    periodo?: number | null;
  }): Promise<{ id: number }> {
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
        updateCommand.hora_apertura = horaApertura;
      }

      if (horaCierre !== undefined) {
        updateCommand.hora_cierre = horaCierre;
      }

      if (periodo !== undefined) {
        updateCommand.periodo = periodo;
      }

      await this.ambienteRepo.update(updateCommand);
    }

    return { id: input.ambiente_id };
  }

  private validateOptionalTime(
    field: 'hora_apertura' | 'hora_cierre',
    value: string | null | undefined,
  ): string | null | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return null;
    }

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
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return null;
    }

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

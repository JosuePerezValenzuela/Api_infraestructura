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

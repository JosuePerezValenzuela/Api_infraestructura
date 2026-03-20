import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  AmbienteRepositoryPort,
  AmbienteRepositoryPort as AmbienteRepoToken,
} from '../domain/ambiente.repository.port';

interface HorarioInput {
  dia: number;
  apertura: string;
  cierre: string;
}

@Injectable()
export class ReplaceHorariosUseCase {
  constructor(
    @Inject(AmbienteRepoToken)
    private readonly ambienteRepo: AmbienteRepositoryPort,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async execute(input: {
    ambiente_id: number;
    periodo: number;
    horarios: HorarioInput[];
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

    const periodo = this.validatePeriodo(input.periodo);
    const validatedHorarios = input.horarios.map((h) =>
      this.validateHorario(h),
    );

    await this.dataSource.query(
      'DELETE FROM infraestructura.horarios_operacion WHERE ambiente_id = $1',
      [input.ambiente_id],
    );

    if (validatedHorarios.length === 0) {
      return { ambiente_id: input.ambiente_id, total: 0 };
    }

    const insertSql = this.buildInsertSql(validatedHorarios.length);
    const params = this.buildInsertParams(
      input.ambiente_id,
      periodo,
      validatedHorarios,
    );

    await this.dataSource.query(insertSql, params);

    return { ambiente_id: input.ambiente_id, total: validatedHorarios.length };
  }

  private validatePeriodo(value: number): number {
    if (!Number.isInteger(value) || value <= 0) {
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

  private validateHorario(horario: HorarioInput): HorarioInput {
    if (!Number.isInteger(horario.dia) || horario.dia < 0 || horario.dia > 6) {
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

    if (!this.isValidTime(horario.apertura)) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          {
            field: 'apertura',
            message: 'apertura debe tener formato HH:mm',
          },
        ],
      });
    }

    if (!this.isValidTime(horario.cierre)) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          {
            field: 'cierre',
            message: 'cierre debe tener formato HH:mm',
          },
        ],
      });
    }

    if (!this.isStartBeforeEnd(horario.apertura, horario.cierre)) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          {
            field: 'apertura',
            message: 'apertura debe ser menor que cierre',
          },
        ],
      });
    }

    return horario;
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

  private buildInsertSql(total: number): string {
    const values = Array.from({ length: total })
      .map((_, index) => {
        const base = index * 5;
        return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`;
      })
      .join(', ');

    return `
      INSERT INTO infraestructura.horarios_operacion (ambiente_id, dia, hora_inicio, hora_fin, periodo)
      VALUES ${values}
    `;
  }

  private buildInsertParams(
    ambiente_id: number,
    periodo: number,
    horarios: HorarioInput[],
  ): Array<string | number> {
    const params: Array<string | number> = [];
    for (const h of horarios) {
      params.push(ambiente_id, h.dia, h.apertura, h.cierre, periodo);
    }
    return params;
  }
}

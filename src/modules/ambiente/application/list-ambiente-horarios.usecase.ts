import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  AmbienteRepositoryPort,
  AmbienteRepositoryPort as AmbienteRepoToken,
} from '../domain/ambiente.repository.port';

interface HorarioOperacionRow {
  dia: number;
  hora_inicio: string;
  hora_fin: string;
  periodo: number;
}

const DIAS = [
  'Lunes',
  'Martes',
  'Miercoles',
  'Jueves',
  'Viernes',
  'Sabado',
  'Domingo',
];

@Injectable()
export class ListAmbienteHorariosUseCase {
  constructor(
    @Inject(AmbienteRepoToken)
    private readonly ambienteRepo: AmbienteRepositoryPort,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async execute(input: { ambiente_id: number }): Promise<{
    ambiente_id: number;
    ambiente_nombre: string;
    periodo: number;
    horarios: Array<{
      dia: number;
      nombre_dia: string;
      apertura: string;
      cierre: string;
    }>;
  }> {
    const ambiente = await this.ambienteRepo.findById(input.ambiente_id);
    if (!ambiente) {
      throw new NotFoundException({
        error: 'NOT_FOUND',
        message: 'No se encontro el ambiente solicitado',
      });
    }

    const sql = `
      SELECT dia, hora_inicio, hora_fin, periodo
      FROM infraestructura.horarios_operacion
      WHERE ambiente_id = $1
      ORDER BY dia ASC
    `;
    const rows = await this.dataSource.query<HorarioOperacionRow[]>(sql, [
      input.ambiente_id,
    ]);

    const periodo = rows.length > 0 ? rows[0].periodo : null;

    const horarios = rows.map((row) => ({
      dia: row.dia,
      nombre_dia: DIAS[row.dia],
      apertura: row.hora_inicio,
      cierre: row.hora_fin,
    }));

    return {
      ambiente_id: ambiente.id,
      ambiente_nombre: ambiente.nombre,
      periodo: periodo ?? 0,
      horarios,
    };
  }
}

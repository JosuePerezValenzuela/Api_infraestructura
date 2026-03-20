import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  AmbienteRepositoryPort,
  AmbienteRepositoryPort as AmbienteRepoToken,
} from '../domain/ambiente.repository.port';

@Injectable()
export class ListAmbienteHorariosUseCase {
  constructor(
    @Inject(AmbienteRepoToken)
    private readonly ambienteRepo: AmbienteRepositoryPort,
  ) {}

  async execute(input: { ambiente_id: number }): Promise<{
    hora_apertura: string | null;
    hora_cierre: string | null;
    periodo: number | null;
  }> {
    const ambiente = await this.ambienteRepo.findById(input.ambiente_id);
    if (!ambiente) {
      throw new NotFoundException({
        error: 'NOT_FOUND',
        message: 'No se encontro el ambiente solicitado',
      });
    }

    return {
      hora_apertura: ambiente.hora_apertura ?? null,
      hora_cierre: ambiente.hora_cierre ?? null,
      periodo: ambiente.periodo ?? null,
    };
  }
}

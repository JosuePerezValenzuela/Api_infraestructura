import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  AmbienteRepositoryPort,
  AmbienteRepositoryPort as AmbienteRepoToken,
} from '../domain/ambiente.repository.port';
import { HorarioRepositoryPort } from '../domain/horario.repository.port';

@Injectable()
export class DeleteAmbienteUseCase {
  constructor(
    @Inject(AmbienteRepoToken)
    private readonly ambienteRepo: AmbienteRepositoryPort,
    @Inject(HorarioRepositoryPort)
    private readonly horarioRepo: HorarioRepositoryPort,
  ) {}

  async execute(payload: { id: number }): Promise<{ id: number }> {
    // 1. Verificar que el ambiente exista
    const ambiente = await this.ambienteRepo.findById(payload.id);
    if (!ambiente) {
      throw new NotFoundException({
        error: 'NOT_FOUND',
        message: 'No se encontró el ambiente solicitado',
        details: [{ field: 'id', message: 'Ambiente inexistente' }],
      });
    }

    // 2. Eliminar horarios de operación del ambiente
    await this.horarioRepo.deleteByAmbienteId(payload.id);

    // 3. Desvincular activos (ambiente_id = NULL)
    await this.ambienteRepo.deleteAssets(payload.id);

    // 4. Eliminar el ambiente físicamente
    await this.ambienteRepo.delete({ id: payload.id });

    return { id: payload.id };
  }
}

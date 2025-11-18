import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  AmbienteRepositoryPort,
  AmbienteRepositoryPort as AmbienteRepoToken,
} from '../domain/ambiente.repository.port';

@Injectable()
export class DeleteAmbienteUseCase {
  constructor(
    @Inject(AmbienteRepoToken)
    private readonly ambienteRepo: AmbienteRepositoryPort,
  ) {}

  async execute(payload: { id: number }): Promise<{ id: number }> {
    const ambiente = await this.ambienteRepo.findById(payload.id);
    if (!ambiente) {
      throw new NotFoundException({
        error: 'NOT_FOUND',
        message: 'No se encontró el ambiente solicitado',
      });
    }

    await this.ambienteRepo.deleteAssets(payload.id);
    return this.ambienteRepo.delete({ id: payload.id });
  }
}

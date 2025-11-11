// Este caso de uso elimina un tipo de ambiente validando reglas básicas antes de llegar al repositorio.
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { TipoAmbienteRepositoryPort } from '../domain/tipo-ambiente.repository.port';

@Injectable()
export class DeleteTipoAmbienteUseCase {
  constructor(
    @Inject(TipoAmbienteRepositoryPort)
    private readonly tipoAmbienteRepository: TipoAmbienteRepositoryPort,
  ) {}

  async execute(payload: { id: number }): Promise<{ id: number }> {
    this.ensureIdIsValid(payload.id);

    return this.tipoAmbienteRepository.delete({ id: payload.id });
  }

  private ensureIdIsValid(id: number) {
    if (!Number.isInteger(id) || id < 1) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          { field: 'id', message: 'El id debe ser un número entero >= 1' },
        ],
      });
    }
  }
}

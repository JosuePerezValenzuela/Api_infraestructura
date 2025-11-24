import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ActivoRepositoryPort,
  ActivoRepositoryPort as ActivoRepoToken,
} from '../domain/activo.repository.port';

// Caso de uso encargado de eliminar un activo validando previamente el id.
// Los comentarios explican cada paso para quien reciГ©n empieza.
@Injectable()
export class DeleteActivoUseCase {
  constructor(
    @Inject(ActivoRepoToken)
    private readonly repo: ActivoRepositoryPort,
  ) {}

  async execute(payload: { id: number }): Promise<{ id: number }> {
    const { id } = payload;

    // Validamos que el id sea un entero positivo.
    this.ensureIdIsValid(id);

    // Verificamos si el activo existe antes de eliminar.
    const found = await this.repo.findById(id);
    if (!found) {
      throw new NotFoundException({
        error: 'NOT_FOUND',
        message: 'No se encontrГі el activo solicitado',
      });
    }

    // Delegamos la eliminaciГіn al repositorio.
    return this.repo.delete({ id });
  }

  private ensureIdIsValid(id: number) {
    // Un id vГЎlido debe ser entero y mayor o igual a 1.
    if (!Number.isInteger(id) || id < 1) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [{ field: 'id', message: 'El id debe ser un numero entero >= 1' }],
      });
    }
  }
}

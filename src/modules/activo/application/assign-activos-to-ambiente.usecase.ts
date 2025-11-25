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
import { AmbienteRepositoryPort } from '../../ambiente/domain/ambiente.repository.port';

// Caso de uso para asociar varios activos a un ambiente.
// Incluimos comentarios para que sea fÃ¡cil de seguir.
@Injectable()
export class AssignActivosToAmbienteUseCase {
  constructor(
    @Inject(ActivoRepoToken)
    private readonly activoRepo: ActivoRepositoryPort,
    @Inject(AmbienteRepositoryPort)
    private readonly ambienteRepo: AmbienteRepositoryPort,
  ) {}

  async execute(input: {
    ambienteId: number;
    activoIds: number[];
  }): Promise<{ updatedIds: number[] }> {
    const ambienteId = input.ambienteId;
    const activoIds = input.activoIds;

    // Validamos ambienteId y la lista de activos.
    this.ensureAmbienteIdIsValid(ambienteId);
    const normalizedActivoIds = this.normalizeActivoIds(activoIds);

    // Verificamos que el ambiente exista.
    const ambiente = await this.ambienteRepo.findById(ambienteId);
    if (!ambiente) {
      throw new NotFoundException({
        error: 'NOT_FOUND',
        message: 'No se encontrÃ³ el ambiente solicitado',
      });
    }

    // Ejecutamos la asignacion en el repositorio de activos.
    await this.activoRepo.assignToAmbiente(ambienteId, normalizedActivoIds);

    return { updatedIds: normalizedActivoIds };
  }

  private ensureAmbienteIdIsValid(id: number) {
    if (!Number.isInteger(id) || id < 1) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          {
            field: 'ambienteId',
            message: 'El ambienteId debe ser un entero >= 1',
          },
        ],
      });
    }
  }

  private normalizeActivoIds(ids: unknown): number[] {
    // Debe ser un arreglo no vacÃ­o.
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          {
            field: 'activoIds',
            message: 'Debes enviar al menos un id de activo',
          },
        ],
      });
    }

    // Filtramos y validamos cada elemento.
    const unique = new Set<number>();
    ids.forEach((value, index) => {
      if (!Number.isInteger(value) || value < 1) {
        throw new BadRequestException({
          error: 'VALIDATION_ERROR',
          message: 'Los datos enviados no son validos',
          details: [
            {
              field: `activoIds[${index}]`,
              message: 'Cada id debe ser un entero positivo',
            },
          ],
        });
      }
      unique.add(value);
    });

    return Array.from(unique.values());
  }
}

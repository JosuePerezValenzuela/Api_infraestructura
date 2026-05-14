// Este caso de uso elimina un tipo de ambiente validando reglas básicas antes de llegar al repositorio.
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TipoAmbienteRepositoryPort } from '../domain/tipo-ambiente.repository.port';

@Injectable()
export class DeleteTipoAmbienteUseCase {
  constructor(
    @Inject(TipoAmbienteRepositoryPort)
    private readonly repo: TipoAmbienteRepositoryPort,
  ) {}

  async execute({ id }: { id: number }): Promise<{ id: number }> {
    // Validación del ID
    if (!Number.isInteger(id) || id < 1) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          { field: 'id', message: 'El id debe ser un número entero >= 1' },
        ],
      });
    }

    // Busqueda del tipo de ambiente por su identificador
    const current = await this.repo.findById(id);
    if (!current) {
      throw new NotFoundException({
        error: 'NOT_FOUND',
        message: 'No se encontro el tipo de ambiente',
        details: [
          {
            field: 'id',
            message: 'El tipo de ambiente indicado no existe',
          },
        ],
      });
    }

    // Verificar si hay ambientes relacionados
    const relatedAmbientes = await this.repo.findRelatedAmbientes(id);
    if (relatedAmbientes.length > 0) {
      throw new ConflictException({
        error: 'CONFLICT_ERROR',
        message: 'No se puede eliminar el tipo de ambiente',
        details: relatedAmbientes.map((ambiente) => ({
          field: 'ambientes',
          message: `Ambiente "${ambiente.nombre}" (${ambiente.codigo}) depende de este tipo de ambiente`,
          id: ambiente.id,
          codigo: ambiente.codigo,
          nombre: ambiente.nombre,
          activo: ambiente.activo,
        })),
      });
    }

    // Eliminar el tipo de ambiente
    return this.repo.delete(id);
  }
}

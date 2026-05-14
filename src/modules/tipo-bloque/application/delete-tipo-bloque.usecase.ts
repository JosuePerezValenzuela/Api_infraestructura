import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TipoBloqueRepositoryPort } from '../domain/tipo-bloque.repository.port';
import { RelationshipsPort } from '../../_shared/relationships/domain/relationships.port';

@Injectable()
export class DeleteTipoBloqueUseCase {
  constructor(
    @Inject(TipoBloqueRepositoryPort)
    private readonly repo: TipoBloqueRepositoryPort,
    @Inject(RelationshipsPort)
    private readonly relationships: RelationshipsPort,
  ) {}
  async execute({ id }: { id: number }): Promise<{ id: number }> {
    // Busqueda del tipo de bloque por su identificador
    const current = await this.repo.findById(id);
    if (!current) {
      throw new NotFoundException({
        error: 'NOT_FOUND',
        message: 'No se encontro el tipo de bloque',
        details: [
          {
            field: 'id',
            message: 'El tipo de bloque indicado no existe',
          },
        ],
      });
    }

    // Verificar si hay bloques relacionados
    const relatedBloques = await this.repo.findRelatedBloques(id);
    if (relatedBloques.length > 0) {
      throw new ConflictException({
        error: 'CONFLICT_ERROR',
        message: 'No se puede eliminar el tipo de bloque',
        details: relatedBloques.map((bloque) => ({
          field: 'bloques',
          message: `Bloque "${bloque.nombre}" (${bloque.codigo}) depende de este tipo de bloque`,
          id: bloque.id,
          codigo: bloque.codigo,
          nombre: bloque.nombre,
          activo: bloque.activo,
        })),
      });
    }

    // Eliminar el tipo de bloque
    return this.repo.delete(id);
  }
}

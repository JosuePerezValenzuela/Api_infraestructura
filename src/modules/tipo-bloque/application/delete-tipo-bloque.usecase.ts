import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TipoBloqueRepositoryPort } from '../domain/tipo-bloque.repository.port';
import { RelationshipsPort } from '../../_shared/relationships/domain/relationships.port';

@Injectable()
export class DeleteTipoBloqueUseCase {
  constructor(
    @Inject('TipoBloqueRepositoryPort')
    private readonly repo: TipoBloqueRepositoryPort,
    @Inject('RelationshipPort')
    private readonly relationships: RelationshipsPort,
  ) {}
  async execute({ id }: { id: number }): Promise<{ id: number }> {
    //Busqueda del tipo de bloque por su identificador
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

    //En caso de que exista el bloque, usamos relationships elimine en cascada
    await this.relationships.deleteTipoBloqueCascade(id);

    return { id };
  }
}

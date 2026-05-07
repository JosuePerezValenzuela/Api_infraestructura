import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BloqueRepositoryPort } from '../domain/bloque.repository.port';
import { RelationshipsPort } from 'src/modules/_shared/relationships/domain/relationships.port';

@Injectable()
export class DeleteBloqueUseCase {
  constructor(
    @Inject(BloqueRepositoryPort)
    private readonly bloqueRepo: BloqueRepositoryPort,
    @Inject(RelationshipsPort)
    private readonly relationshipsRepo: RelationshipsPort,
  ) {}

  async execute({ id }: { id: number }): Promise<{ id: number }> {
    const current = await this.bloqueRepo.findById(id);
    if (!current) {
      throw new NotFoundException({
        error: 'NOT_FOUND',
        message: [{ field: 'id', message: 'Bloque inexistene' }],
      });
    }

    // Soft delete: desactivamos el bloque y todos sus ambientes
    // (usamos la misma lógica que cuando se desactiva un bloque desde update)
    await this.relationshipsRepo.markBloquesCascadeInactive(id);

    return { id };
  }
}

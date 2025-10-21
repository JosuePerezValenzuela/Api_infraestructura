import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { FacultadRepositoryPort } from '../domain/facultad.repository.port';
import { RelationshipsPort } from '../../_shared/relationships/domain/relationships.port';

@Injectable()
export class DeleteFacultadUseCase {
  constructor(
    @Inject(FacultadRepositoryPort)
    private readonly facultadRepo: FacultadRepositoryPort,
    @Inject(RelationshipsPort)
    private readonly relationshipsRepo: RelationshipsPort,
  ) {}

  async execute({ id }: { id: number }): Promise<{ id: number }> {
    const current = await this.facultadRepo.findById(id);
    if (!current) {
      throw new NotFoundException({
        error: 'NOT_FOUND',
        message: 'No se encontro la facultad',
        details: [{ field: 'id', message: 'Facultad inexistente' }],
      });
    }

    await this.relationshipsRepo.deleteFacultadCascade(id);
    return { id };
  }
}

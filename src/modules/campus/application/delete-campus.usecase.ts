import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CampusRepositoryPort } from '../domain/campus.repository.port';
import { RelationshipsPort } from '../../_shared/relationships/domain/relationships.port';

@Injectable()
export class DeleteCampusUseCase {
  constructor(
    @Inject(CampusRepositoryPort)
    private readonly campusPort: CampusRepositoryPort,
    @Inject(RelationshipsPort)
    private readonly relationPort: RelationshipsPort,
  ) {}

  async execute({ id }: { id: number }): Promise<{ id: number }> {
    const current = await this.campusPort.findById(id);
    if (!current) {
      throw new NotFoundException('No se encontro el campus');
    }

    await this.relationPort.deleteCampusCascade(id);
    return { id };
  }
}

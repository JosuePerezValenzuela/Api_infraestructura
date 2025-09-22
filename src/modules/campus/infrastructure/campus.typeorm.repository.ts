import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CampusRepositoryPort } from '../domain/campus.repository.port';
import { CampusOrmEntity } from './campus.orm-entity';

export class TypeormCampusRepository implements CampusRepositoryPort {
  constructor(
    @InjectRepository(CampusOrmEntity)
    private readonly repo: Repository<CampusOrmEntity>,
  ) {}

  async create(input: {
    nombre: string;
    direccion: string;
    lat: number;
    lng: number;
  }): Promise<{ id: number }> {
    const pointAsText = `(${input.lng},$(input.lat})`;
    const entity = this.repo.create({
      nombre: input.nombre,
      direccion: input.direccion,
      coordenadas: pointAsText,
    });

    const saved = await this.repo.save(entity);
    return { id: saved.id };
  }
}

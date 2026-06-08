import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { CampusRepositoryPort } from '../domain/campus.repository.port';
import { CacheService } from '../../_shared/infrastructure/cache/cache.service';

@Injectable()
export class CreateCampusUseCase {
  constructor(
    @Inject(CampusRepositoryPort) private readonly repo: CampusRepositoryPort,
    private readonly cacheService: CacheService,
  ) {}

  async execute(cmd: {
    nombre: string;
    codigo: string;
    direccion: string;
    lat: number;
    lng: number;
  }): Promise<{ id: number }> {
    try {
      const result = await this.repo.create(cmd);
      await this.cacheService.invalidateNamespace('campus:*');
      return result;
    } catch {
      throw new ConflictException('Ya existe un campus con el mismo código');
    }
    //Reglas de negocio como validaciones de dominio
  }
}

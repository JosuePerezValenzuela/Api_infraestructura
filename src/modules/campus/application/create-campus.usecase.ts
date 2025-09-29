import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { CampusRepositoryPort } from '../domain/campus.repository.port';

@Injectable()
export class CreateCampusUseCase {
  constructor(
    @Inject(CampusRepositoryPort) private readonly repo: CampusRepositoryPort,
  ) {}

  async execute(cmd: {
    nombre: string;
    codigo: string;
    direccion: string;
    lat: number;
    lng: number;
  }): Promise<{ id: number }> {
    try {
      return await this.repo.create(cmd);
    } catch (e: any) {
      throw new ConflictException('Ya existe un campus con el mismo código');
      throw e;
    }
    //Reglas de negocio como validaciones de dominio
  }
}

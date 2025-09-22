import { Inject, Injectable } from '@nestjs/common';
import { CampusRepositoryPort } from '../domain/campus.repository.port';

@Injectable()
export class CreateCampusUseCase {
  constructor(
    @Inject(CampusRepositoryPort) private readonly repo: CampusRepositoryPort,
  ) {}

  async execute(cmd: {
    nombre: string;
    direccion: string;
    lat: number;
    lng: number;
  }): Promise<{ id: number }> {
    //Reglas de negocio como validaciones de dominio
    return this.repo.create(cmd);
  }
}

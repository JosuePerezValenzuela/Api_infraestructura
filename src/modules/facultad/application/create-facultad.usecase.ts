import {
  Inject,
  Injectable,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { FacultadRepositoryPort } from '../domain/facultad.repository.port';
import { CampusRepositoryPort } from 'src/modules/campus/domain/campus.repository.port';
import { GeoPoint } from 'src/modules/_shared/domain/value-objects/geo-point.vo';

@Injectable
export class CreateFacultadUseCase {
  constructor(
    @Inject(FacultadRepositoryPort)
    private readonly facultadRepository: FacultadRepositoryPort,
    @Inject(CampusRepositoryPort)
    private readonly CampusRepository: CampusRepositoryPort,
  ) {}

  async execute(input: {
    codigo: string;
    nombre: string;
    nombre_corto: string | null;
    lat: number;
    lng: number;
    campus_id: number;
  }): Promise<{ id: number }> {
    throw new Error('Not implemented');
  }
}

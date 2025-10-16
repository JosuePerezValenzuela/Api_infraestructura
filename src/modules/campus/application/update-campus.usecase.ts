import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CampusRepositoryPort } from '../domain/campus.repository.port';
import { RelationshipsPort } from '../../_shared/relationships/domain/relationships.port';
import { NotFoundException, ConflictException } from '@nestjs/common';

type UpdateCampusInput = {
  id: number;
  data: Partial<{
    codigo?: string;
    nombre?: string;
    direccion?: string;
    lat?: number;
    lng?: number;
    activo?: boolean;
    creado_en: Date;
    actualizado_en: Date;
  }>;
};

type UpdateCampusOutput = { idResp: number };

@Injectable()
export class UpdateCampusUseCase {
  constructor(
    @Inject(CampusRepositoryPort) private readonly repo: CampusRepositoryPort,
    @Inject(RelationshipsPort)
    private readonly relationships: RelationshipsPort,
  ) {}

  async execute({ id, data }: UpdateCampusInput): Promise<UpdateCampusOutput> {
    //Vericamos si existe
    const current = await this.repo.findById(id);
    if (!current) {
      throw new NotFoundException('No se encontro el campus');
    }

    //Evitar actualizacines vacias
    if (
      data.codigo === undefined &&
      data.nombre === undefined &&
      data.direccion === undefined &&
      data.lat === undefined &&
      data.lng === undefined &&
      data.activo === undefined
    ) {
      throw new BadRequestException('No se enviaron datos para actualizar');
    }

    //Normalizacion de datos
    data.codigo = data.codigo?.trim();
    data.nombre = data.nombre?.trim();
    data.direccion = data.direccion?.trim();

    //Regla: lat/lng deben ir juntos, en el DTO se valida, pero tambien aqui
    const latProvided = typeof data.lat === 'number';
    const lngProvided = typeof data.lng === 'number';
    if (latProvided !== lngProvided) {
      throw new BadRequestException('Debe enviar lat y lng juntos');
    }

    //El codigo es unico?
    if (data.codigo) {
      const taken = await this.repo.isCodeTaken(data.codigo, id);
      if (taken) {
        throw new ConflictException('Ya existe un campus con el mismo codigo');
      }
    }

    const shouldDeactivateDependents =
      typeof data.activo === 'boolean' &&
      data.activo === false &&
      current.activo === true;

    await this.repo.update(id, data);

    if (shouldDeactivateDependents) {
      await this.relationships.markCampusCascadeInactive(id);
    }

    return { idResp: id };
  }
}

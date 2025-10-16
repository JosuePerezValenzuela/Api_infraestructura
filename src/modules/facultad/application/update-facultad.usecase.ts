import {
  BadRequestException,
  NotFoundException,
  ConflictException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { FacultadRepositoryPort } from '../domain/facultad.repository.port';
import { RelationshipsPort } from '../../_shared/relationships/domain/relationships.port';
import { CampusRepositoryPort } from 'src/modules/campus/domain/campus.repository.port';
import {
  facultadCompleta,
  UpdateFacultadesInputAndId,
} from '../domain/facultad.list.types';

@Injectable()
export class UpdateFacultadUseCase {
  constructor(
    @Inject(FacultadRepositoryPort)
    private readonly facultadRepo: FacultadRepositoryPort,
    @Inject(RelationshipsPort)
    private readonly relationshipRepo: RelationshipsPort,
    @Inject(CampusRepositoryPort)
    private readonly campusRepo: CampusRepositoryPort,
  ) {}

  async execute({
    id,
    input,
  }: UpdateFacultadesInputAndId): Promise<{ id: number }> {
    //Verificacion de que este id existe
    const current: facultadCompleta | null =
      await this.facultadRepo.findById(id);
    if (!current) {
      throw new NotFoundException({
        error: 'NOT_FOUND',
        message: 'No se encontro una facultad con ese ID',
        details: [{ field: 'id', message: 'facultad no encontrada' }],
      });
    }

    //No permitir actualizaciones vacias
    if (
      input.codigo === undefined &&
      input.nombre === undefined &&
      input.nombre_corto === undefined &&
      input.lng === undefined &&
      input.lat === undefined &&
      input.activo === undefined &&
      input.campus_id === undefined
    ) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [{ field: 'Todos', message: 'Ningun cambio' }],
      });
    }

    //Normalizamos las entradas
    input.codigo = input.codigo?.trim();
    input.nombre = input.nombre?.trim();
    input.nombre_corto = input.nombre_corto?.trim();

    //Validamos la latitud y longitud
    const latProvided = typeof input.lat === 'number';
    const lngProvided = typeof input.lng === 'number';
    if (latProvided !== lngProvided) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          { field: 'lat y/o lng', message: 'Debe enviar lat y lng juntos' },
        ],
      });
    }

    // El nuevo codigo es unico?
    if (input.codigo) {
      const taken = await this.facultadRepo.isCodeTaken(input.codigo, id);
      if (taken) {
        throw new ConflictException({
          error: 'VALIDATION_ERROR',
          message: 'El codigo ya existe',
          details: [{ field: 'codigo', message: 'EL codigo es duplicado' }],
        });
      }
    }

    // Validamos que el nuevo campus_id exista
    if (input.campus_id !== undefined) {
      const existCampus = await this.campusRepo.findById(input.campus_id);
      if (existCampus === null) {
        throw new BadRequestException({
          error: 'VALIDATION_ERROR',
          message: 'El campus no existe',
          details: [{ field: 'campus_id', message: 'Campus inexistente' }],
        });
      }
    }

    const shouldDeactivateDependents =
      typeof input.activo === 'boolean' &&
      input.activo === false &&
      current.activo === true;

    await this.facultadRepo.update(id, input);

    if (shouldDeactivateDependents) {
      await this.relationshipRepo.markFacultadCascadeInactive(id);
    }

    return { id };
  }
}

import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { BloqueRepositoryPort } from '../domain/bloque.repository.port';
import { FacultadRepositoryPort } from 'src/modules/facultad/domain/facultad.repository.port';
import { TipoBloqueRepositoryPort } from 'src/modules/tipo-bloque/domain/tipo-bloque.repository.port';
import { RelationshipsPort } from 'src/modules/_shared/relationships/domain/relationships.port';
import { GeoPoint } from 'src/modules/_shared/domain/value-objects/geo-point.vo';
import { UpdateBloqueCommand } from '../domain/commands/update-bloque.command';

@Injectable()
export class UpdateBloqueUseCase {
  constructor(
    @Inject(BloqueRepositoryPort)
    private readonly bloqueRepo: BloqueRepositoryPort,
    @Inject(FacultadRepositoryPort)
    private readonly facultadRepo: FacultadRepositoryPort,
    @Inject(TipoBloqueRepositoryPort)
    private readonly tipoBloqueRepo: TipoBloqueRepositoryPort,
    @Inject(RelationshipsPort)
    private readonly relationshipsRepo: RelationshipsPort,
  ) {}

  async execute({
    id,
    input,
  }: {
    id: number;
    input: {
      codigo?: string;
      nombre?: string;
      nombre_corto?: string | null;
      pisos?: number;
      lat?: number;
      lng?: number;
      activo?: boolean;
      facultad_id?: number;
      tipo_bloque_id?: number;
    };
  }): Promise<{ id: number }> {
    const current = await this.bloqueRepo.findById(id);

    if (!current) {
      throw new NotFoundException({
        error: 'NOT_FOUND',
        message: 'No se encontro el bloque solicitado',
        details: [{ field: 'id', message: 'Bloque inexistente' }],
      });
    }

    const hasChanges =
      input.codigo !== undefined ||
      input.nombre !== undefined ||
      input.nombre_corto !== undefined ||
      input.pisos !== undefined ||
      input.lat !== undefined ||
      input.lng !== undefined ||
      input.activo !== undefined ||
      input.facultad_id !== undefined ||
      input.tipo_bloque_id !== undefined;

    if (!hasChanges) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          {
            field: 'payload',
            message: 'Debes enviar al menos un campo para actualizar',
          },
        ],
      });
    }

    const codigo = input.codigo !== undefined ? input.codigo.trim() : undefined;
    const nombre = input.nombre !== undefined ? input.nombre.trim() : undefined;
    const nombre_corto =
      input.nombre_corto !== undefined && input.nombre_corto !== null
        ? input.nombre_corto?.trim()
        : (input.nombre_corto ?? undefined);

    if (codigo !== undefined && codigo.length === 0) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          { field: 'codigo', message: 'El codigo no puede estar vacio' },
        ],
      });
    }

    if (nombre !== undefined && nombre.length === 0) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          { field: 'nombre', message: 'El nombre no puede estar vacio' },
        ],
      });
    }

    let normalizeNombreCorto: string | null | undefined = undefined;

    if (nombre_corto !== undefined) {
      if (nombre_corto === null) {
        normalizeNombreCorto = null;
      } else if (nombre_corto.length === 0) {
        throw new BadRequestException({
          error: 'VALIDATION_ERROR',
          message: 'Los datos enviados no son validos',
          details: [
            {
              field: 'nombre_corto',
              message: 'El nombre_corto no puede estar vacio',
            },
          ],
        });
      } else {
        normalizeNombreCorto = nombre_corto;
      }
    }

    if (input.pisos !== undefined) {
      if (
        !Number.isInteger(input.pisos) ||
        input.pisos < 1 ||
        input.pisos > 99
      ) {
        throw new BadRequestException({
          error: 'VALIDATION_ERROR',
          message: 'Los datos enviados no son validos',
          details: [
            {
              field: 'pisos',
              message: 'Los pisos deben ser un entero entre 1 y 99',
            },
          ],
        });
      }
    }

    const latProvided = input.lat !== undefined && input.lat !== null;
    const lngProvided = input.lng !== undefined && input.lng !== null;

    if (latProvided !== lngProvided) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          {
            field: 'lat/lng',
            message: 'Debes enviar lat y lng juntos',
          },
        ],
      });
    }

    let pointLiteral: string | undefined;
    if (latProvided && lngProvided) {
      try {
        const geoPoint = GeoPoint.create({
          lat: input.lat as number,
          lng: input.lng as number,
        });
        pointLiteral = geoPoint.toPostgresPointLiteral();
      } catch (error) {
        throw new BadRequestException({
          error: 'VALIDATION_ERROR',
          message: 'Los datos enviados no son validos',
          details: [
            {
              field: 'coordenadas',
              message: (error as Error).message,
            },
          ],
        });
      }
    }

    if (codigo !== undefined) {
      const codeTaken = await this.bloqueRepo.isCodeTaken(codigo, id);
      if (codeTaken) {
        throw new ConflictException({
          error: 'CONFLICT',
          message: 'Ya existe un bloque con el mismo codigo',
          details: [
            {
              field: 'codigo',
              message: 'El codigo indicado ya esta en un uso por otro bloque',
            },
          ],
        });
      }
    }

    if (input.facultad_id !== undefined) {
      const facultad = await this.facultadRepo.findById(input.facultad_id);
      if (!facultad) {
        throw new BadRequestException({
          error: 'VALIDATION_ERROR',
          message: 'Los datos enviados no son validos',
          details: [
            {
              field: 'facultad_id',
              message: 'La facultad indicada no existe',
            },
          ],
        });
      }
    }

    if (input.tipo_bloque_id !== undefined) {
      const tipoBloque = await this.tipoBloqueRepo.findById(
        input.tipo_bloque_id,
      );
      if (!tipoBloque) {
        throw new BadRequestException({
          error: 'VALIDATION_ERROR',
          message: 'Los datos enviados no son validos',
          details: [
            {
              field: 'tipo_bloque_id',
              message: 'El tipo de bloque indicado no existe',
            },
          ],
        });
      }
    }

    const command: UpdateBloqueCommand = {
      id,
      ...(codigo !== undefined ? { codigo } : {}),
      ...(nombre !== undefined ? { nombre } : {}),
      ...(normalizeNombreCorto !== undefined
        ? { nombre_corto: normalizeNombreCorto }
        : {}),
      ...(input.pisos !== undefined ? { pisos: input.pisos } : {}),
      ...(pointLiteral !== undefined ? { coordinates: { pointLiteral } } : {}),
      ...(input.activo !== undefined ? { activo: input.activo } : {}),
      ...(input.facultad_id !== undefined
        ? { facultad_id: input.facultad_id }
        : {}),
      ...(input.tipo_bloque_id !== undefined
        ? { tipo_bloque_id: input.tipo_bloque_id }
        : {}),
    };

    const { id: aux } = await this.bloqueRepo.update(command);

    const shouldCascadeDeactivate =
      input.activo === false && current.activo == true;

    if (shouldCascadeDeactivate) {
      await this.relationshipsRepo.markBloquesCascadeInactive(id);
    }

    return { id: aux };
  }
}

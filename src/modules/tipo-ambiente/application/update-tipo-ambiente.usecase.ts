import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TipoAmbienteRepositoryPort } from '../domain/tipo-ambiente.repository.port';
import { UpdateTipoAmbienteCommand } from '../domain/commands/update-tipo-ambiente.command';

@Injectable()
export class UpdateTipoAmbienteUseCase {
  constructor(
    @Inject(TipoAmbienteRepositoryPort)
    private readonly repository: TipoAmbienteRepositoryPort,
  ) {}

  async execute(input: {
    id: number;
    nombre?: string;
    descripcion?: string;
    descripcion_corta?: string | null;
    activo?: boolean;
  }): Promise<{ id: number }> {
    this.ensureIdIsValid(input.id);

    const payload = this.preparePayload(input);
    if (!this.hasChanges(payload)) {
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

    const existing = await this.repository.findById(input.id);
    if (!existing) {
      throw new NotFoundException({
        error: 'NOT_FOUND',
        message: 'No se encontro el tipo de ambiente',
        details: [{ field: 'id', message: 'El tipo de ambiente no existe' }],
      });
    }

    if (payload.nombre) {
      const duplicated = await this.repository.isNameTakenByOther(
        payload.nombre,
        input.id,
      );
      if (duplicated) {
        throw new ConflictException({
          error: 'CONFLICT_ERROR',
          message: 'Los datos enviados no son validos',
          details: [
            {
              field: 'nombre',
              message: 'Ya existe un tipo de ambiente con ese nombre',
            },
          ],
        });
      }
    }

    return this.repository.update(payload);
  }

  private preparePayload(input: {
    id: number;
    nombre?: string;
    descripcion?: string;
    descripcion_corta?: string | null;
    activo?: boolean;
  }) {
    const payload: UpdateTipoAmbienteCommand = { id: input.id };

    if (input.nombre !== undefined) {
      const nombre = input.nombre.trim();
      this.ensureNombreIsValid(nombre);
      payload.nombre = nombre;
    }

    if (input.descripcion !== undefined) {
      const descripcion = input.descripcion.trim();
      this.ensureDescripcionIsValid(descripcion);
      payload.descripcion = descripcion;
    }

    if (input.descripcion_corta !== undefined) {
      const trimmed = input.descripcion_corta?.trim();
      const descripcion_corta = trimmed && trimmed.length > 0 ? trimmed : null;
      this.ensureDescripcionCortaIsValid(descripcion_corta ?? null);
      payload.descripcion_corta = descripcion_corta;
    }

    if (input.activo !== undefined) {
      payload.activo = input.activo;
    }

    return payload;
  }

  private hasChanges(payload: UpdateTipoAmbienteCommand) {
    const { id, ...rest } = payload;
    return Object.values(rest).some((value) => value !== undefined);
  }

  private ensureIdIsValid(id: number) {
    if (!Number.isInteger(id) || id < 1) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          { field: 'id', message: 'El id debe ser un número entero >= 1' },
        ],
      });
    }
  }

  private ensureNombreIsValid(nombre: string) {
    if (nombre.length === 0) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          { field: 'nombre', message: 'El nombre no puede estar vacio' },
        ],
      });
    }
    if (nombre.length > 64) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          {
            field: 'nombre',
            message: 'El nombre no debe exceder los 64 caracteres',
          },
        ],
      });
    }
  }

  private ensureDescripcionIsValid(descripcion: string) {
    if (descripcion.length === 0) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          {
            field: 'descripcion',
            message: 'La descripcion no puede estar vacia',
          },
        ],
      });
    }
    if (descripcion.length > 256) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          {
            field: 'descripcion',
            message: 'La descripcion no debe exceder los 256 caracteres',
          },
        ],
      });
    }
  }

  private ensureDescripcionCortaIsValid(descripcion_corta: string | null) {
    if (descripcion_corta && descripcion_corta.length > 32) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          {
            field: 'descripcion_corta',
            message: 'La descripcion corta no debe exceder los 32 caracteres',
          },
        ],
      });
    }
  }
}

import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ActivoRepositoryPort,
  ActivoRepositoryPort as ActivoRepoToken,
} from '../domain/activo.repository.port';
import { CreateActivoCommand } from '../domain/commands/create-activo.command';
import { UpdateActivoCommand } from '../domain/commands/update-activo.command';

// Caso de uso para crear o actualizar un activo usando su NIA como clave natural.
@Injectable()
export class UpsertActivoByNiaUseCase {
  constructor(
    @Inject(ActivoRepoToken)
    private readonly repo: ActivoRepositoryPort,
  ) {}

  async execute(input: {
    nia: string;
    nombre?: string;
    descripcion?: string | null;
    ambiente_id?: number | null;
  }): Promise<{ id: number; nia: string; created: boolean }> {
    // Normalizamos cada campo recortando espacios.
    const nia = input.nia?.trim();
    const nombre = input.nombre?.trim();
    const descripcion =
      input.descripcion === undefined || input.descripcion === null
        ? input.descripcion
        : input.descripcion.trim();
    const ambienteId =
      input.ambiente_id === undefined ? undefined : input.ambiente_id;

    // Validamos reglas de NIA antes de consultar la base.
    this.ensureNiaIsValid(nia);

    // Revisamos si ya existe un activo con esa NIA.
    const existing = await this.repo.findByNia(nia);
    const isNew = !existing;

    // Si es inserción exigimos nombre; en update es opcional.
    if (isNew && !nombre) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          {
            field: 'nombre',
            message: 'El nombre es obligatorio para crear el activo',
          },
        ],
      });
    }

    // Validamos cada campo presente.
    if (nombre !== undefined) this.ensureNombreIsValid(nombre);
    if (descripcion !== undefined) this.ensureDescripcionIsValid(descripcion);

    // Si se envía un ambiente_id diferente de null, confirmamos que exista.
    if (ambienteId !== undefined && ambienteId !== null) {
      const existsAmbiente = await this.repo.existsAmbiente(ambienteId);
      if (!existsAmbiente) {
        throw new NotFoundException({
          error: 'NOT_FOUND',
          message: 'No se encontro el ambiente solicitado',
          details: [
            {
              field: 'ambiente_id',
              message: 'El ambiente indicado no existe',
            },
          ],
        });
      }
    }

    // Ramas separadas para crear o actualizar.
    if (isNew) {
      const command: CreateActivoCommand = {
        nia: nia,
        nombre: nombre!,
        descripcion:
          descripcion === undefined || descripcion === null
            ? undefined
            : descripcion,
        ambiente_id: ambienteId ?? undefined,
      };
      const { id } = await this.repo.create(command);
      return { id, nia: nia, created: true };
    }

    // Si no hay cambios para actualizar, avisamos con error.
    const hasPayload =
      nombre !== undefined ||
      descripcion !== undefined ||
      ambienteId !== undefined;
    if (!hasPayload) {
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

    const updateCommand: UpdateActivoCommand = { id: existing.id };
    if (nombre !== undefined) updateCommand.nombre = nombre;
    if (descripcion !== undefined) updateCommand.descripcion = descripcion;
    if (ambienteId !== undefined) updateCommand.ambiente_id = ambienteId;

    await this.repo.update(updateCommand);

    return { id: existing.id, nia: nia, created: false };
  }

  private ensureNiaIsValid(nia?: string) {
    if (!nia) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [{ field: 'nia', message: 'El NIA no puede estar vacio' }],
      });
    }
    if (nia.length > 32) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          {
            field: 'nia',
            message: 'El NIA no debe exceder los 32 caracteres',
          },
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
    if (nombre.length > 32) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          {
            field: 'nombre',
            message: 'El nombre no debe exceder los 32 caracteres',
          },
        ],
      });
    }
  }

  private ensureDescripcionIsValid(descripcion: string | null) {
    if (descripcion !== null && descripcion.length > 128) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          {
            field: 'descripcion',
            message: 'La descripcion no debe exceder los 128 caracteres',
          },
        ],
      });
    }
  }

  private ensureAmbienteIdIsValid(ambienteId: number | null) {
    if (ambienteId === null) {
      return;
    }
    if (!Number.isInteger(ambienteId) || ambienteId < 1) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          {
            field: 'ambiente_id',
            message: 'El ambiente_id debe ser un numero entero positivo',
          },
        ],
      });
    }
  }
}

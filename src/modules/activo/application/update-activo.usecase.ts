import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ActivoRepositoryPort,
  ActivoRepositoryPort as ActivoRepoToken,
} from '../domain/activo.repository.port';
import { UpdateActivoCommand } from '../domain/commands/update-activo.command';

// Caso de uso que actualiza activos aplicando validaciones de negocio.
// Cada bloque de codigo incluye un comentario sencillo para guiar a quien aprende.
@Injectable()
export class UpdateActivoUseCase {
  constructor(
    @Inject(ActivoRepoToken)
    private readonly repo: ActivoRepositoryPort,
  ) {}

  async execute(input: {
    id: number;
    nia?: string;
    nombre?: string;
    descripcion?: string | null;
    ambiente_id?: number | null;
  }): Promise<{ id: number }> {
    // Validamos que el id sea un entero positivo.
    this.ensureIdIsValid(input.id);

    // Normalizamos strings recortando espacios.
    const nia = input.nia?.trim();
    const nombre = input.nombre?.trim();
    const descripcion =
      input.descripcion === undefined || input.descripcion === null
        ? input.descripcion
        : input.descripcion.trim();
    const ambienteId = input.ambiente_id ?? null;

    // Armamos el payload parcial solo con los campos presentes.
    const payload: UpdateActivoCommand = { id: input.id };
    if (nia !== undefined) payload.nia = nia;
    if (nombre !== undefined) payload.nombre = nombre;
    if (descripcion !== undefined) payload.descripcion = descripcion;
    if (ambienteId !== null) payload.ambiente_id = ambienteId;
    if (ambienteId === null && input.ambiente_id !== undefined) {
      // Permite poner el ambiente en null explicitamente.
      payload.ambiente_id = null;
    }

    // Si no hay cambios, avisamos con un error amigable.
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

    // Validamos cada campo presente.
    if (payload.nia !== undefined) this.ensureNiaIsValid(payload.nia);
    if (payload.nombre !== undefined) this.ensureNombreIsValid(payload.nombre);
    if (payload.descripcion !== undefined)
      this.ensureDescripcionIsValid(payload.descripcion);
    if (payload.ambiente_id !== undefined)
      this.ensureAmbienteIdIsValid(payload.ambiente_id);

    // Confirmamos que el activo existe antes de continuar.
    const current = await this.repo.findById(input.id);
    if (!current) {
      throw new NotFoundException({
        error: 'NOT_FOUND',
        message: 'No se encontrГі el activo solicitado',
      });
    }

    // Si cambia el NIA, verificamos duplicados excluyendo el propio id.
    if (payload.nia) {
      const duplicated = await this.repo.isNiaTaken(payload.nia, input.id);
      if (duplicated) {
        throw new ConflictException({
          error: 'CONFLICT_ERROR',
          message: 'Los datos enviados no son validos',
          details: [{ field: 'nia', message: 'Ya existe un activo con ese NIA' }],
        });
      }
    }

    // Ejecutamos la actualizacion en el repositorio.
    return this.repo.update(payload);
  }

  private hasChanges(payload: UpdateActivoCommand): boolean {
    // Revisa si hay alguna propiedad distinta a id.
    return (
      payload.nia !== undefined ||
      payload.nombre !== undefined ||
      payload.descripcion !== undefined ||
      payload.ambiente_id !== undefined
    );
  }

  private ensureIdIsValid(id: number) {
    // El id debe ser entero y positivo.
    if (!Number.isInteger(id) || id < 1) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [{ field: 'id', message: 'El id debe ser un numero entero >= 1' }],
      });
    }
  }

  private ensureNiaIsValid(nia: string) {
    // NIA no puede estar vacio y tiene limite de 32 caracteres.
    if (nia.length === 0) {
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
          { field: 'nia', message: 'El NIA no debe exceder los 32 caracteres' },
        ],
      });
    }
  }

  private ensureNombreIsValid(nombre: string) {
    // El nombre es obligatorio y no debe superar 32 caracteres.
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
    // La descripcion puede ser null o string; si es string, limitamos a 128 caracteres.
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
    // Permitimos null para limpiar el ambiente; si hay numero, debe ser entero >= 1.
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

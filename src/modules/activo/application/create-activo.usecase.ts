import { BadRequestException, ConflictException, Inject } from '@nestjs/common';
import {
  ActivoRepositoryPort,
  ActivoRepositoryPort as ActivoRepoToken,
} from '../domain/activo.repository.port';
import { CreateActivoCommand } from '../domain/commands/create-activo.command';

// Caso de uso encargado de validar y crear un activo.
// Cada bloque tiene comentarios para que alguien sin experiencia entienda el flujo.
export class CreateActivoUseCase {
  constructor(
    @Inject(ActivoRepoToken)
    private readonly repo: ActivoRepositoryPort,
  ) {}

  async execute(payload: Partial<CreateActivoCommand>): Promise<{ id: number }> {
    // Tomamos el NIA y lo recortamos para eliminar espacios iniciales o finales.
    const nia = payload.nia?.trim();
    // Hacemos lo mismo con el nombre.
    const nombre = payload.nombre?.trim();
    // La descripcion es opcional, tambien la recortamos si viene.
    const descripcion = payload.descripcion?.trim();
    // ambiente_id puede venir indefinido, lo guardamos tal cual.
    const ambiente_id = payload.ambiente_id ?? null;

    // Validamos que el NIA cumpla las reglas de longitud y obligatoriedad.
    this.ensureNiaIsValid(nia);
    // Validamos el nombre con las reglas de negocio.
    this.ensureNombreIsValid(nombre);
    // Validamos la descripcion solo si existe para respetar el limite de 128 chars.
    this.ensureDescripcionIsValid(descripcion);
    // Validamos que el ambiente_id, si viene, sea entero positivo.
    this.ensureAmbienteIdIsValid(ambiente_id);

    // Preguntamos al repositorio si ya existe un activo con el mismo NIA para evitar duplicados.
    const taken = await this.repo.isNiaTaken(nia!);
    if (taken) {
      // Lanzamos ConflictException en el formato estandarizado de la API.
      throw new ConflictException({
        error: 'CONFLICT_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          { field: 'nia', message: 'Ya existe un activo con ese NIA' },
        ],
      });
    }

    // Construimos el comando listo para la capa de infraestructura.
    const command: CreateActivoCommand = {
      nia: nia!,
      nombre: nombre!,
      descripcion: descripcion || undefined,
      ambiente_id,
    };

    // Si el ambiente es null lo eliminamos para no enviar la clave al INSERT.
    if (command.ambiente_id === null) {
      delete command.ambiente_id;
    }

    // Delegamos la insercion al repositorio y devolvemos el id resultante.
    return this.repo.create(command);
  }

  private ensureNiaIsValid(nia?: string) {
    // Si no hay valor, devolvemos BadRequest con el formato acordado.
    if (!nia) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [{ field: 'nia', message: 'El NIA no puede estar vacio' }],
      });
    }
    // Longitud maxima de 32 caracteres para evitar datos corruptos.
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

  private ensureNombreIsValid(nombre?: string) {
    // Nombre requerido; si es vacio lanzamos error.
    if (!nombre) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [{ field: 'nombre', message: 'El nombre no puede estar vacio' }],
      });
    }
    // Limite superior de 32 caracteres.
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

  private ensureDescripcionIsValid(descripcion?: string) {
    // Si no hay descripcion, no hacemos nada porque es opcional.
    if (!descripcion) {
      return;
    }
    // Verificamos el limite maximo de 128 caracteres.
    if (descripcion.length > 128) {
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
    // Si es null o undefined no validamos porque significa "sin ambiente".
    if (ambienteId === null || ambienteId === undefined) {
      return;
    }
    // Debe ser un entero.
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

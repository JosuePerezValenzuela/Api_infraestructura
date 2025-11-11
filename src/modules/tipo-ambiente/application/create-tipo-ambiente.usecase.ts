import { BadRequestException, ConflictException, Inject } from '@nestjs/common';
import { TipoAmbienteRepositoryPort } from '../domain/tipo-ambiente.repository.port';
import { CreateTipoAmbienteCommand } from '../domain/commands/create-tipo-ambiente.command';

export class CreateTipoAmbienteUseCase {
  constructor(
    @Inject(TipoAmbienteRepositoryPort)
    private readonly repo: TipoAmbienteRepositoryPort,
  ) {}

  async execute(
    payload: Partial<CreateTipoAmbienteCommand>,
  ): Promise<{ id: number }> {
    const nombre = payload.nombre?.trim();
    const descripcion = payload.descripcion?.trim();
    const descripcion_corta = payload.descripcion_corta?.trim();

    // Validamos que el nombre cumpla las reglas de negocio explicando cualquier error.
    this.ensureNombreIsValid(nombre);
    // Validamos la descripción aplicando longitud máxima y obligatoriedad.
    this.ensureDescripcionIsValid(descripcion);
    // Validamos la descripción corta solo cuando existe para mantenerla dentro del límite permitido.
    this.ensureDescripcionCortaIsValid(descripcion_corta);

    // Consultamos si el nombre ya existe para evitar duplicados y proteger la integridad del catálogo.
    const isTaken = await this.repo.isNameTaken(nombre!);
    if (isTaken) {
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

    // activo true por defecto.
    const command: CreateTipoAmbienteCommand = {
      nombre: nombre!,
      descripcion: descripcion!,
      descripcion_corta,
      activo: true,
    };

    // Si la descripción corta quedó vacía la removemos para no enviar valores undefined al repositorio.
    if (!command.descripcion_corta) {
      delete command.descripcion_corta;
    }

    return this.repo.create(command);
  }

  // Valida el nombre.
  private ensureNombreIsValid(nombre?: string) {
    if (!nombre) {
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

  private ensureDescripcionIsValid(descripcion?: string) {
    if (!descripcion) {
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

  private ensureDescripcionCortaIsValid(descripcion_corta?: string) {
    if (!descripcion_corta) {
      return;
    }

    if (descripcion_corta.length > 32) {
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

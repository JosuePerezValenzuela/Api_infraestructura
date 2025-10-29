import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TipoBloqueRepositoryPort } from '../domain/tipo-bloque.repository.port';
import { UpdateTipoBloqueCommand } from '../domain/commands/update-tipo-bloque.command';

@Injectable()
export class UpdateTipoBloqueUseCase {
  constructor(
    @Inject(TipoBloqueRepositoryPort)
    private readonly repo: TipoBloqueRepositoryPort,
  ) {}

  async execute(input: {
    id: number;
    nombre?: string;
    descripcion?: string;
    activo?: boolean;
  }): Promise<{ id: number }> {
    const id = input.id;
    const trimmedName =
      input.nombre !== undefined ? input.nombre.trim() : undefined;
    const trimmedDescription =
      input.descripcion !== undefined ? input.descripcion.trim() : undefined;
    const activo = input.activo;

    const validationError = (field: string, message: string) => {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [{ field, message }],
      });
    };

    //Verificar que el tipo de bloque exista
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new NotFoundException({
        error: 'NOT_FOUND',
        message: 'No se encontro el tipo de bloque',
        details: [
          { field: 'id', message: 'El tipo de bloque indicado no existe' },
        ],
      });
    }

    //Validacion del campos
    if (trimmedName !== undefined) {
      if (trimmedName.length < 1 || trimmedName.length > 64) {
        validationError(
          'nombre',
          'El nombre debe tener entre 1 y 64 caracteres cuando se envia',
        );
      }

      const nameChanged = trimmedName !== existing.nombre;
      if (nameChanged) {
        const nameTaken = await this.repo.isNameTakenByOther(trimmedName, id);
        if (nameTaken) {
          throw new ConflictException({
            error: 'CONFLICT_ERROR',
            message: 'Los datos enviados no son validos',
            details: [
              {
                field: 'nombre',
                message: 'Ya existe un tipo de bloque con ese nombre',
              },
            ],
          });
        }
      }
    }

    // Validacion de la descripcion
    if (trimmedDescription !== undefined) {
      if (trimmedDescription.length < 1 || trimmedDescription.length > 256) {
        validationError(
          'descripcion',
          'La descripcion debe tener entre 1 y 256 caracteres cuando se envia',
        );
      }
    }

    // Cambios
    const changes: Partial<UpdateTipoBloqueCommand> = {};

    if (trimmedName !== undefined && trimmedName !== existing.nombre) {
      changes.nombre = trimmedName;
    }

    if (
      trimmedDescription !== undefined &&
      trimmedDescription !== existing.descripcion
    ) {
      changes.descripcion = trimmedDescription;
    }

    if (activo !== undefined && activo !== existing.activo) {
      changes.activo = activo;
    }

    // Si no hay cambios a realizar lanzamos un badRequest
    if (Object.keys(changes).length === 0) {
      validationError(
        'payload',
        'Debes enviar datos diferentes para actualizar el tipo de bloque',
      );
    }

    const command: UpdateTipoBloqueCommand = { id, ...changes };
    const { id: updatedId } = await this.repo.update(command);
    return { id: updatedId };
  }
}

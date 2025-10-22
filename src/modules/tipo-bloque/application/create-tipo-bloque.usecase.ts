import {
  Inject,
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { TipoBloqueRepositoryPort } from '../domain/tipo-bloque.repository.port';
import { CreateTipoBloqueCommand } from '../domain/commands/create-tipo-bloque.command';

@Injectable()
export class CreateTipoBloqueUseCase {
  constructor(
    @Inject(TipoBloqueRepositoryPort)
    private readonly repo: TipoBloqueRepositoryPort,
  ) {}

  async execute(input: {
    nombre: string;
    descripcion: string;
    activo: boolean;
  }): Promise<{ id: number }> {
    const nombre = input.nombre?.trim() ?? '';
    const descripcion = input.descripcion.trim() ?? '';

    const validationError = (field: string, message: string) => {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [{ field, message }],
      });
    };

    if (nombre.length === 0 || nombre.length > 64) {
      validationError('nombre', 'El nombre debe tener entre 1 y 64 caracteres');
    }

    if (descripcion.length === 0 || descripcion.length > 256) {
      validationError(
        'descripcion',
        'La descripcion debe tener entre 1 y 256 caracteres',
      );
    }

    const nameTaken = await this.repo.isNameTaken(nombre);
    if (nameTaken) {
      throw new ConflictException({
        error: 'CONF_ERROR',
        message: 'Los datos enviados no son validos',
        details: ['name', 'El nombre debe ser unico'],
      });
    }

    const activo = input.activo ?? true;
    const command: CreateTipoBloqueCommand = { nombre, descripcion, activo };
    return this.repo.create(command);
  }
}

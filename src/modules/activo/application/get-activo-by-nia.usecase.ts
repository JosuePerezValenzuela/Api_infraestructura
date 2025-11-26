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

// Caso de uso para obtener un activo por NIA incluyendo su ambiente.
// Cada bloque tiene comentarios para que sea fácil de seguir.
@Injectable()
export class GetActivoByNiaUseCase {
  constructor(
    @Inject(ActivoRepoToken)
    private readonly repo: ActivoRepositoryPort,
  ) {}

  async execute(input: { nia: string }): Promise<{
    id: number;
    nia: string;
    nombre: string;
    descripcion: string | null;
    ambiente_id: number | null;
    ambiente_nombre: string | null;
  }> {
    // Recortamos la NIA para evitar espacios accidentales.
    const nia = input.nia?.trim();

    // Validamos que la NIA tenga datos y no exceda el límite permitido.
    this.ensureNiaIsValid(nia);

    // Consultamos el repositorio para obtener los detalles, incluido el ambiente.
    const activo = await this.repo.findDetailsByNia(nia);

    // Si no se encontró, respondemos con 404 y un mensaje claro.
    if (!activo) {
      throw new NotFoundException({
        error: 'NOT_FOUND',
        message: 'No se encontro el activo solicitado',
      });
    }

    // Devolvemos tal cual lo que retorna el repositorio (ya mapeado).
    return activo;
  }

  private ensureNiaIsValid(nia?: string) {
    // Si falta la NIA, devolvemos un error de validación.
    if (!nia || nia.length === 0) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [{ field: 'nia', message: 'El NIA no puede estar vacio' }],
      });
    }

    // En la tabla el NIA admite hasta 32 caracteres; aplicamos el mismo límite.
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
}

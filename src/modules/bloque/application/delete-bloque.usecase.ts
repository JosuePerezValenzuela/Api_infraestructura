import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CacheService } from '../../_shared/infrastructure/cache/cache.service';
import { BloqueRepositoryPort } from '../domain/bloque.repository.port';

@Injectable()
export class DeleteBloqueUseCase {
  constructor(
    @Inject(BloqueRepositoryPort)
    private readonly bloqueRepo: BloqueRepositoryPort,
    private readonly cacheService: CacheService,
  ) {}

  async execute({ id }: { id: number }): Promise<{ id: number }> {
    // 1. Verificar que el bloque exista
    const current = await this.bloqueRepo.findById(id);
    if (!current) {
      throw new NotFoundException({
        error: 'NOT_FOUND',
        message: 'No se encontro el bloque',
        details: [{ field: 'id', message: 'Bloque inexistente' }],
      });
    }

    // 2. Verificar si hay ambientes dependientes
    const relatedAmbientes = await this.bloqueRepo.findRelatedAmbientes(id);
    if (relatedAmbientes.length > 0) {
      throw new ConflictException({
        error: 'CONFLICT_ERROR',
        message:
          'No se puede eliminar el bloque porque tiene ambientes dependientes',
        details: relatedAmbientes.map((a) => ({
          field: 'ambientes',
          message: `Ambiente "${a.nombre}" (${a.codigo}) de tipo "${a.tipo_ambiente_nombre}"`,
          ambiente: {
            id: a.id,
            codigo: a.codigo,
            nombre: a.nombre,
            nombre_corto: a.nombre_corto,
            tipo_ambiente_nombre: a.tipo_ambiente_nombre,
            activo: a.activo,
          },
        })),
      });
    }

    // 3. Delete físico del bloque
    await this.bloqueRepo.delete(id);
    await this.cacheService.invalidateNamespace('bloque:*');
    return { id };
  }
}

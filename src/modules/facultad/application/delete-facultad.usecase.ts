import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { FacultadRepositoryPort } from '../domain/facultad.repository.port';

@Injectable()
export class DeleteFacultadUseCase {
  constructor(
    @Inject(FacultadRepositoryPort)
    private readonly facultadRepo: FacultadRepositoryPort,
  ) {}

  async execute({ id, campusId }: { id: number; campusId: number }): Promise<{ id: number; deletedFacultad?: boolean }> {
    // 1. Verificar que la facultad exista
    const facultad = await this.facultadRepo.findById(id);
    if (!facultad) {
      throw new NotFoundException({
        error: 'NOT_FOUND',
        message: 'No se encontro la facultad',
        details: [{ field: 'id', message: 'Facultad inexistente' }],
      });
    }

    // 2. Verificar que el campus exista
    const campus = await this.facultadRepo.findCampusById(campusId);
    if (!campus) {
      throw new NotFoundException({
        error: 'NOT_FOUND',
        message: 'No se encontro el campus',
        details: [{ field: 'campusId', message: 'Campus inexistente' }],
      });
    }

    // 3. Verificar que la relación entre facultad y campus exista (activas o inactivas)
    const relacion = await this.facultadRepo.findCampusFacultadRelationship(id, campusId);
    if (!relacion) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'No existe relacion entre la facultad y el campus',
        details: [
          {
            field: 'campusId',
            message: `La facultad con ID ${id} no esta vinculada al campus con ID ${campusId}`,
          },
        ],
      });
    }

    // 4. Verificar si hay bloques dependientes de esta relación específica
    const relatedBlocks = await this.facultadRepo.findBlocksByCampusFacultadId(relacion.id);
    if (relatedBlocks.length > 0) {
      throw new ConflictException({
        error: 'CONFLICT_ERROR',
        message: 'No se puede eliminar la relacion porque hay bloques dependientes',
        details: relatedBlocks.map((b) => ({
          field: 'bloques',
          message: `Bloque "${b.nombre}" (${b.codigo}) depende de esta relacion`,
          block: {
            id: b.id,
            codigo: b.codigo,
            nombre: b.nombre,
            nombre_corto: b.nombre_corto,
            activo: b.activo,
            campus_nombre: b.campus_nombre,
          },
        })),
      });
    }

    // 5. Eliminar la relación específica
    await this.facultadRepo.deleteRelationship(id, campusId);

    // 6. Verificar si la facultad tiene otras relaciones (activas o inactivas)
    const hasOtherRelations = await this.facultadRepo.hasOtherRelationships(id, campusId);

    // Si no tiene más relaciones, eliminar la facultad también
    if (!hasOtherRelations) {
      await this.facultadRepo.deleteFacultad(id);
      return { id, deletedFacultad: true };
    }

    return { id, deletedFacultad: false };
  }
}
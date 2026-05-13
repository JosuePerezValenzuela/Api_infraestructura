import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CampusRepositoryPort } from '../domain/campus.repository.port';

@Injectable()
export class DeleteCampusUseCase {
  constructor(
    @Inject(CampusRepositoryPort)
    private readonly campusPort: CampusRepositoryPort,
  ) {}

  async execute({ id }: { id: number }): Promise<{ id: number }> {
    const current = await this.campusPort.findById(id);
    if (!current) {
      throw new NotFoundException('No se encontro el campus');
    }

    // Verificar si existen relaciones con facultades (activas o inactivas)
    const relatedFaculties = await this.campusPort.findRelatedFaculties(id);
    if (relatedFaculties.length > 0) {
      throw new ConflictException({
        error: 'CONFLICT_ERROR',
        message: 'No se puede eliminar el campus porque tiene facultades relacionadas',
        details: relatedFaculties.map((f) => ({
          field: 'facultades',
          message: `Facultad "${f.nombre}" (${f.codigo}) está relacionada con este campus`,
          faculty: {
            id: f.id,
            codigo: f.codigo,
            nombre: f.nombre,
            nombre_corto: f.nombre_corto,
            activo: f.activo,
          },
        })),
      });
    }

    // Delete físico del campus
    await this.campusPort.delete(id);
    return { id };
  }
}
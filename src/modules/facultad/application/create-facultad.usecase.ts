import {
  Inject,
  Injectable,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { FacultadRepositoryPort } from '../domain/facultad.repository.port';
import { CampusRepositoryPort } from '../../campus/domain/campus.repository.port';
import { CreateFacultadCommand } from './dto/create-facultad.command';
import { CacheService } from '../../_shared/infrastructure/cache/cache.service';

@Injectable()
export class CreateFacultadUseCase {
  constructor(
    @Inject(FacultadRepositoryPort)
    private readonly facultadRepository: FacultadRepositoryPort,
    @Inject(CampusRepositoryPort)
    private readonly campusRepository: CampusRepositoryPort,
    private readonly cacheService: CacheService,
  ) {}

  async execute(cmd: CreateFacultadCommand): Promise<{ id: number }> {
    // Verificamos que todos los campus_ids existan
    for (const campusId of cmd.campus_ids) {
      const campus = await this.campusRepository.findById(Number(campusId));
      if (!campus) {
        throw new BadRequestException(`El campus con ID ${campusId} no existe`);
      }
    }

    // verificamos que no exista otra facultadad con el mismo codigo
    const codeTaken = await this.facultadRepository.isCodeTaken(cmd.codigo);
    if (codeTaken) {
      throw new ConflictException('Ya existe una facultad con el mismo codigo');
    }

    // Ejecutamos al que creara la facultad
    const created = await this.facultadRepository.create({
      codigo: cmd.codigo,
      nombre: cmd.nombre,
      nombre_corto: cmd.nombre_corto,
      campus_ids: cmd.campus_ids,
    });

    // Invalidamos el cache de facultades para que las listas reflejen el nuevo registro
    await this.cacheService.invalidateNamespace('facultad:*');

    return created;
  }
}

import {
  Inject,
  Injectable,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { FacultadRepositoryPort } from '../domain/facultad.repository.port';
import { CampusRepositoryPort } from '../../campus/domain/campus.repository.port';
import { GeoPoint } from '../../_shared/domain/value-objects/geo-point.vo';
import { CreateFacultadCommand } from './dto/create-facultad.command';

@Injectable()
export class CreateFacultadUseCase {
  constructor(
    @Inject(FacultadRepositoryPort)
    private readonly facultadRepository: FacultadRepositoryPort,
    @Inject(CampusRepositoryPort)
    private readonly campusRepository: CampusRepositoryPort,
  ) {}

  async execute(cmd: CreateFacultadCommand): Promise<{ id: number }> {
    // Verificamos que campus_id exista
    const campus = await this.campusRepository.findById(cmd.campus_id);
    if (!campus) {
      throw new BadRequestException('El campus indicado no existe');
    }

    // verificamos que no exista otra facultadad con el mismo codigo
    const codeTaken = await this.facultadRepository.isCodeTaken(cmd.codigo);
    if (codeTaken) {
      throw new ConflictException('Ya existe una facultad con el mismo codigo');
    }

    //Creamos el POINT a guardar en postgres
    const geoPoint = GeoPoint.create({ lat: cmd.lat, lng: cmd.lng });
    const pointLiteral = geoPoint.toPostgresPointLiteral();

    //Ejecutamos al que creara la facultad
    const created = await this.facultadRepository.create({
      codigo: cmd.codigo,
      nombre: cmd.nombre,
      nombre_corto: cmd.nombre_corto,
      campus_id: cmd.campus_id,
      pointLiteral,
    });

    return created;
  }
}

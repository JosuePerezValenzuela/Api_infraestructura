import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { GeoPoint } from './../../_shared/domain/value-objects/geo-point.vo';
import { BloqueRepositoryPort } from '../domain/bloque.repository.port';
import { FacultadRepositoryPort } from './../../facultad/domain/facultad.repository.port';
import { TipoBloqueRepositoryPort } from './../../tipo-bloque/domain/tipo-bloque.repository.port';
import { CreateBloqueCommand } from '../domain/commands/create-bloque.command';

@Injectable()
export class CreateBloqueUseCase {
  constructor(
    @Inject(BloqueRepositoryPort)
    private readonly bloqueRepo: BloqueRepositoryPort,
    @Inject(FacultadRepositoryPort)
    private readonly facultadRepos: FacultadRepositoryPort,
    @Inject(TipoBloqueRepositoryPort)
    private readonly tipoBloqueRepo: TipoBloqueRepositoryPort,
  ) {}

  async execute(input: {
    codigo: string;
    nombre: string;
    nombre_corto?: string | null;
    lat: number;
    lng: number;
    pisos: number;
    activo?: boolean;
    facultad_id: number;
    tipo_bloque_id: number;
  }): Promise<{ id: number }> {
    //Limpieza de strings
    const codigo = input.codigo.trim();
    const nombre = input.nombre.trim();
    const nombre_corto = input.nombre_corto?.trim() ?? null;
    const activo = input.activo ?? true;

    //Validar que su codigo sea unico
    const taken = await this.bloqueRepo.isCodeTaken(codigo);
    if (taken) {
      throw new ConflictException({
        error: 'CONFLICT_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          {
            field: 'codigo',
            message: 'Ya existe un bloque con el mismo codigo',
          },
        ],
      });
    }

    //Validacion de que facultad exista
    const takenFacultad = await this.facultadRepos.findById(input.facultad_id);
    if (!takenFacultad) {
      throw new BadRequestException({
        error: 'CONFLICT_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          { field: 'facultad_ id', message: 'La facultad indicada no existe' },
        ],
      });
    }

    const takenTipo = await this.tipoBloqueRepo.findById(input.tipo_bloque_id);
    if (!takenTipo) {
      throw new BadRequestException({
        error: 'CONFLICT_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          {
            field: 'tipo_bloque_id',
            message: 'El tipo_bloque_id indicado no existe',
          },
        ],
      });
    }
    let pointLiteral: string;
    try {
      const geoPoint = GeoPoint.create({ lat: input.lat, lng: input.lng });
      pointLiteral = geoPoint.toPostgresPointLiteral();
    } catch (err) {
      const message = (err as Error).message;
      let field: string;

      if (message.includes('Latitud')) {
        field = 'Latitud';
      } else if (message.includes('Longitud')) {
        field = 'Longitud';
      } else {
        field = 'Campo desconocido';
      }

      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [{ field, message }],
      });
    }

    const command: CreateBloqueCommand = {
      codigo,
      nombre,
      nombre_corto,
      pointLiteral,
      pisos: input.pisos,
      activo,
      facultad_id: input.facultad_id,
      tipo_bloque_id: input.tipo_bloque_id,
    };

    return this.bloqueRepo.create(command);
  }
}

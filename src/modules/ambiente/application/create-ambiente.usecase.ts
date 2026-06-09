import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { CacheService } from '../../_shared/infrastructure/cache/cache.service';
import { CreateAmbienteCommand } from '../domain/commands/create-ambiente.command';
import {
  AmbienteRepositoryPort,
  AmbienteRepositoryPort as AmbientePortToken,
} from '../domain/ambiente.repository.port';
import {
  BloqueRepositoryPort,
  BloqueRepositoryPort as BloquePortToken,
} from '../../bloque/domain/bloque.repository.port';
import {
  TipoAmbienteRepositoryPort,
  TipoAmbienteRepositoryPort as TipoAmbientePortToken,
} from '../../tipo-ambiente/domain/tipo-ambiente.repository.port';

interface CreateAmbienteInput {
  nombre: string;
  nombre_corto?: string | null;
  codigo: string;
  piso: number;
  capacidad?: { total: number; examen: number };
  dimension?: {
    largo: number;
    ancho: number;
    alto: number;
    unid_med: 'metros';
  };
  clases: boolean;
  activo?: boolean;
  tipo_ambiente_id: number;
  bloque_id: number;
}

@Injectable()
export class CreateAmbienteUseCase {
  constructor(
    @Inject(AmbientePortToken)
    private readonly ambienteRepo: AmbienteRepositoryPort,
    @Inject(BloquePortToken)
    private readonly bloqueRepo: BloqueRepositoryPort,
    @Inject(TipoAmbientePortToken)
    private readonly tipoAmbienteRepo: TipoAmbienteRepositoryPort,
    private readonly cacheService: CacheService,
  ) {}

  async execute(input: CreateAmbienteInput): Promise<{ id: number }> {
    const codigo = input.codigo.trim();
    const nombre = input.nombre.trim();
    const nombre_corto = input.nombre_corto?.trim() ?? null;
    const activo = input.activo ?? true;

    await this.ensureCodeAvailable(codigo);
    await this.ensureBloqueExists(input.bloque_id);
    await this.ensureTipoAmbienteExists(input.tipo_ambiente_id);

    const capacidad = this.normalizeCapacity(input.capacidad);
    const dimension = this.normalizeDimension(input.dimension);

    const command: CreateAmbienteCommand = {
      nombre,
      nombre_corto,
      codigo,
      piso: input.piso,
      capacidad,
      dimension,
      clases: input.clases,
      activo,
      tipo_ambiente_id: input.tipo_ambiente_id,
      bloque_id: input.bloque_id,
    };

    const result = await this.ambienteRepo.create(command);
    await this.cacheService.invalidateNamespace('ambiente:*');
    return result;
  }

  private async ensureCodeAvailable(codigo: string): Promise<void> {
    const taken = await this.ambienteRepo.isCodeTaken(codigo);
    if (taken) {
      throw new ConflictException({
        error: 'CONFLICT_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          {
            field: 'codigo',
            message: 'Ya existe un ambiente con el mismo codigo',
          },
        ],
      });
    }
  }

  private async ensureBloqueExists(bloqueId: number): Promise<void> {
    const bloque = await this.bloqueRepo.findById(bloqueId);
    if (!bloque) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          { field: 'bloque_id', message: 'El bloque indicado no existe' },
        ],
      });
    }

    if (bloque.activo === false) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          {
            field: 'bloque_id',
            message: 'No se pueden crear ambientes en bloques inactivos',
          },
        ],
      });
    }
  }

  private async ensureTipoAmbienteExists(
    tipoAmbienteId: number,
  ): Promise<void> {
    const tipo = await this.tipoAmbienteRepo.findById(tipoAmbienteId);
    if (!tipo) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          {
            field: 'tipo_ambiente_id',
            message: 'El tipo de ambiente indicado no existe',
          },
        ],
      });
    }

    if (tipo.activo === false) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          {
            field: 'tipo_ambiente_id',
            message: 'No se pueden crear ambientes con tipos inactivos',
          },
        ],
      });
    }
  }

  private normalizeCapacity(capacidad?: { total: number; examen: number }): {
    total: number;
    examen: number;
  } {
    const value = capacidad ?? { total: 0, examen: 0 };
    const total = Number(value.total);
    const examen = Number(value.examen);
    if (!Number.isInteger(total) || !Number.isInteger(examen)) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          {
            field: 'capacidad',
            message: 'total y examen deben ser enteros',
          },
        ],
      });
    }

    if (total < 0 || examen < 0) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          {
            field: 'capacidad',
            message: 'total y examen deben ser mayores o iguales a 0',
          },
        ],
      });
    }

    return { total, examen };
  }

  private normalizeDimension(dimension?: {
    largo: number;
    ancho: number;
    alto: number;
    unid_med: 'metros';
  }): {
    largo: number;
    ancho: number;
    alto: number;
    unid_med: 'metros';
  } {
    const value = dimension ?? {
      largo: 0,
      ancho: 0,
      alto: 0,
      unid_med: 'metros',
    };
    const largo = Number(value.largo);
    const ancho = Number(value.ancho);
    const alto = Number(value.alto);
    const unidadesValidas = ['metros', 'centimetros', 'milimetros'] as const;
    const unidadNormalizada = value.unid_med.toLowerCase();

    const isUnidadValida = unidadesValidas.includes(
      unidadNormalizada as (typeof unidadesValidas)[number],
    );
    if (!isUnidadValida) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          {
            field: 'dimension.unid_med',
            message:
              'La unidad de medida debe ser metros, centimetros o milimetros',
          },
        ],
      });
    }

    if (
      !Number.isFinite(largo) ||
      !Number.isFinite(ancho) ||
      !Number.isFinite(alto) ||
      largo < 0 ||
      ancho < 0 ||
      alto < 0
    ) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          {
            field: 'dimension',
            message:
              'largo, ancho y alto deben ser numeros mayores o iguales a 0',
          },
        ],
      });
    }

    return {
      largo,
      ancho,
      alto,
      unid_med: unidadNormalizada as 'metros',
    };
  }
}

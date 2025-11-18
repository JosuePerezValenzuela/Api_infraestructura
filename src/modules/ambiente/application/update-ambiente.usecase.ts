import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AmbienteRepositoryPort,
  AmbienteRepositoryPort as AmbienteRepoToken,
} from '../domain/ambiente.repository.port';
import {
  BloqueRepositoryPort,
  BloqueRepositoryPort as BloqueRepoToken,
} from '../../bloque/domain/bloque.repository.port';
import {
  TipoAmbienteRepositoryPort,
  TipoAmbienteRepositoryPort as TipoAmbienteRepoToken,
} from '../../tipo-ambiente/domain/tipo-ambiente.repository.port';
import { UpdateAmbienteCommand } from '../domain/commands/update-ambiente.command';

@Injectable()
export class UpdateAmbienteUseCase {
  constructor(
    @Inject(AmbienteRepoToken)
    private readonly ambienteRepo: AmbienteRepositoryPort,
    @Inject(BloqueRepoToken)
    private readonly bloqueRepo: BloqueRepositoryPort,
    @Inject(TipoAmbienteRepoToken)
    private readonly tipoRepo: TipoAmbienteRepositoryPort,
  ) {}

  async execute({
    id,
    input,
  }: {
    id: number;
    input: {
      codigo?: string;
      nombre?: string;
      nombre_corto?: string | null;
      piso?: number;
      capacidad?: { total: number; examen: number };
      dimension?: {
        largo: number;
        ancho: number;
        alto: number;
        unid_med: 'metros';
      };
      clases?: boolean;
      activo?: boolean;
      tipo_ambiente_id?: number;
      bloque_id?: number;
    };
  }): Promise<{ id: number }> {
    const current = await this.ambienteRepo.findById(id);
    if (!current) {
      throw new NotFoundException({
        error: 'NOT_FOUND',
        message: 'No se encontró el ambiente solicitado',
      });
    }

    const hasChanges = Object.keys(input).length > 0;
    if (!hasChanges) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          {
            field: 'payload',
            message: 'Debes enviar al menos un campo para actualizar',
          },
        ],
      });
    }

    const command: UpdateAmbienteCommand = { id };

    if (input.codigo !== undefined) {
      const codigo = input.codigo.trim();
      if (!codigo.length) {
        throw new BadRequestException({
          error: 'VALIDATION_ERROR',
          message: 'Los datos enviados no son validos',
          details: [
            { field: 'codigo', message: 'El codigo no puede estar vacio' },
          ],
        });
      }
      const taken = await this.ambienteRepo.isCodeTaken(codigo, id);
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
      command.codigo = codigo;
    }

    if (input.nombre !== undefined) {
      const nombre = input.nombre.trim();
      if (!nombre.length) {
        throw new BadRequestException({
          error: 'VALIDATION_ERROR',
          message: 'Los datos enviados no son validos',
          details: [
            { field: 'nombre', message: 'El nombre no puede estar vacio' },
          ],
        });
      }
      command.nombre = nombre;
    }

    if (input.nombre_corto !== undefined) {
      if (input.nombre_corto === null) {
        command.nombre_corto = null;
      } else {
        const nombre_corto = input.nombre_corto.trim();
        if (!nombre_corto.length) {
          throw new BadRequestException({
            error: 'VALIDATION_ERROR',
            message: 'Los datos enviados no son validos',
            details: [
              {
                field: 'nombre_corto',
                message: 'El nombre_corto no puede estar vacio',
              },
            ],
          });
        }
        command.nombre_corto = nombre_corto;
      }
    }

    if (input.piso !== undefined) {
      if (
        !Number.isInteger(input.piso) ||
        input.piso < -5 ||
        input.piso > 200
      ) {
        throw new BadRequestException({
          error: 'VALIDATION_ERROR',
          message: 'Los datos enviados no son validos',
          details: [
            { field: 'piso', message: 'El piso debe estar entre -5 y 200' },
          ],
        });
      }
      command.piso = input.piso;
    }

    if (input.capacidad !== undefined) {
      command.capacidad = this.normalizeCapacity(input.capacidad);
    }

    if (input.dimension !== undefined) {
      command.dimension = this.normalizeDimension(input.dimension);
    }

    if (input.clases !== undefined) {
      command.clases = input.clases;
    }

    if (input.activo !== undefined) {
      command.activo = input.activo;
    }

    if (input.bloque_id !== undefined) {
      const bloque = await this.bloqueRepo.findById(input.bloque_id);
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
              message: 'No se pueden asignar ambientes a bloques inactivos',
            },
          ],
        });
      }
      command.bloque_id = input.bloque_id;
    }

    if (input.tipo_ambiente_id !== undefined) {
      const tipo = await this.tipoRepo.findById(input.tipo_ambiente_id);
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
              message: 'No se pueden usar tipos de ambiente inactivos',
            },
          ],
        });
      }
      command.tipo_ambiente_id = input.tipo_ambiente_id;
    }

    return this.ambienteRepo.update(command);
  }

  private normalizeCapacity(value: { total: number; examen: number }) {
    const total = Number(value.total);
    const examen = Number(value.examen);
    if (!Number.isInteger(total) || !Number.isInteger(examen)) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          { field: 'capacidad', message: 'total/examen deben ser enteros' },
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

  private normalizeDimension(value: {
    largo: number;
    ancho: number;
    alto: number;
    unid_med: 'metros' | 'centimetros' | 'milimetros';
  }) {
    const largo = Number(value.largo);
    const ancho = Number(value.ancho);
    const alto = Number(value.alto);
    if (
      !Number.isFinite(largo) ||
      !Number.isFinite(ancho) ||
      !Number.isFinite(alto)
    ) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          {
            field: 'dimension',
            message: 'largo/ancho/alto deben ser numéricos',
          },
        ],
      });
    }
    if (largo < 0 || ancho < 0 || alto < 0) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          {
            field: 'dimension',
            message: 'Las dimensiones deben ser mayores o iguales a 0',
          },
        ],
      });
    }
    const unidad = value.unid_med.toLowerCase();
    if (!['metros', 'centimetros', 'milimetros'].includes(unidad)) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          {
            field: 'dimension.unid_med',
            message: 'La unidad debe ser metros, centimetros o milimetros',
          },
        ],
      });
    }
    return {
      largo,
      ancho,
      alto,
      unid_med: unidad as 'metros' | 'centimetros' | 'milimetros',
    };
  }
}

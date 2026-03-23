import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AmbienteRepositoryPort,
  AmbienteRepositoryPort as AmbienteRepoToken,
} from '../domain/ambiente.repository.port';
import { AmbientItem } from '../domain/ambiente.list.types';
import { HorarioRepositoryPort } from '../domain/horario.repository.port';
import { ListActivosUseCase } from '../../activo/application/list-activos.usecase';

export interface GetAmbienteCompletoResult {
  ambiente: AmbientItem;
  horarios: Array<{
    dia: number;
    nombre_dia: string;
    apertura: string;
    cierre: string;
    periodo: number;
  }>;
  activos: {
    items: Array<{
      id: number;
      nia: string;
      nombre: string;
      descripcion: string | null;
      creado_en: string;
      ambiente_id: number | null;
      ambiente_nombre: string | null;
      ambiente_codigo: string | null;
    }>;
    meta: {
      total: number;
      page: number;
      take: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  };
}

@Injectable()
export class GetAmbienteCompletoUseCase {
  constructor(
    @Inject(AmbienteRepoToken)
    private readonly ambienteRepo: AmbienteRepositoryPort,
    @Inject(HorarioRepositoryPort)
    private readonly horarioRepo: HorarioRepositoryPort,
    private readonly listActivosUseCase: ListActivosUseCase,
  ) {}

  async execute(input: {
    ambiente_id: number;
  }): Promise<GetAmbienteCompletoResult> {
    const { ambiente_id } = input;

    if (!Number.isInteger(ambiente_id) || ambiente_id < 1) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          {
            field: 'ambiente_id',
            message: 'El ambiente_id debe ser un numero entero positivo',
          },
        ],
      });
    }

    const ambiente = await this.ambienteRepo.findById(ambiente_id);
    if (!ambiente) {
      throw new NotFoundException({
        error: 'NOT_FOUND',
        message: 'No se encontro el ambiente solicitado',
      });
    }

    const horarios = await this.horarioRepo.findByAmbienteId(ambiente_id);

    const activosResult = await this.listActivosUseCase.execute({
      ambienteId: ambiente_id,
      page: 1,
      limit: 150,
    });

    return {
      ambiente,
      horarios,
      activos: activosResult,
    };
  }
}

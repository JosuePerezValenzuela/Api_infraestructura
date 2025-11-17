/* eslint-disable indent */
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateAmbienteUseCase } from '../application/create-ambiente.usecase';
import { CreateAmbienteDto } from './dto/create-ambiente.dto';

@ApiTags('Ambientes')
@Controller('ambientes')
export class AmbienteController {
  constructor(private readonly createAmbiente: CreateAmbienteUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un nuevo ambiente' })
  @ApiBody({ type: CreateAmbienteDto })
  @ApiCreatedResponse({
    description: 'Ambiente creado correctamente',
    schema: { example: { id: 1 } },
  })
  @ApiBadRequestResponse({
    description: 'Datos invalidos o relaciones inexistentes',
    schema: {
      example: {
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          { field: 'tipo_ambiente_id', message: 'El tipo indicado no existe' },
        ],
      },
    },
  })
  @ApiConflictResponse({
    description: 'Conflicto por codigo duplicado',
    schema: {
      example: {
        error: 'CONFLICT_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          {
            field: 'codigo',
            message: 'Ya existe un ambiente con el mismo codigo',
          },
        ],
      },
    },
  })
  async create(@Body() dto: CreateAmbienteDto) {
    const { id } = await this.createAmbiente.execute({
      nombre: dto.nombre,
      nombre_corto: dto.nombre_corto ?? null,
      codigo: dto.codigo,
      piso: dto.piso,
      capacidad: dto.capacidad
        ? { total: dto.capacidad.total, examen: dto.capacidad.examen }
        : undefined,
      dimension: dto.dimension
        ? {
            largo: dto.dimension.largo,
            ancho: dto.dimension.ancho,
            alto: dto.dimension.alto,
            unid_med: dto.dimension.unid_med,
          }
        : undefined,
      clases: dto.clases,
      activo: dto.activo,
      tipo_ambiente_id: dto.tipo_ambiente_id,
      bloque_id: dto.bloque_id,
    });

    return { id };
  }
}

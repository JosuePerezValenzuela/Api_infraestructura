import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateTipoAmbienteUseCase } from '../application/create-tipo-ambiente.usecase';
import { CreateTipoAmbienteDto } from './dto/create-tipo-ambiente.dto';

@ApiTags('TipoAmbientes')
@Controller('tipo_ambientes')
export class TipoAmbienteController {
  constructor(
    private readonly createTipoAmbienteUseCase: CreateTipoAmbienteUseCase,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Crear un tipo de ambiente',
    description:
      'Registra un nuevo tipo de ambiente para clasificar los espacios físicos.',
  })
  @ApiCreatedResponse({
    description: 'Tipo de ambiente creado correctamente',
    schema: {
      example: { id: 42 },
    },
  })
  @ApiConflictResponse({
    description: 'Conflicto por nombre duplicado',
    schema: {
      example: {
        statusCode: 409,
        error: 'CONFLICT_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          {
            field: 'nombre',
            message: 'Ya existe un tipo de ambiente con ese nombre',
          },
        ],
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos',
    schema: {
      example: {
        statusCode: 400,
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          { field: 'nombre', message: 'El nombre no puede estar vacio' },
        ],
      },
    },
  })
  async create(@Body() dto: CreateTipoAmbienteDto): Promise<{ id: number }> {
    return this.createTipoAmbienteUseCase.execute({
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      descripcion_corta: dto.descripcion_corta,
    });
  }
}

import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateBloqueUseCase } from '../application/create-bloque.usecase';
import { CreateBloqueDto } from './dto/create-bloque.dto';

@ApiTags('Bloques')
@Controller('bloques')
export class BloqueController {
  constructor(private readonly createBloque: CreateBloqueUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un nuevo bloque' })
  @ApiBody({ type: CreateBloqueDto })
  @ApiCreatedResponse({
    description: 'Bloque creado correctamente',
    schema: { example: { id: 1 } },
  })
  @ApiBadRequestResponse({
    description: 'Datos invalidos o relaciones inexistentes',
    schema: {
      example: {
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          { field: 'facultad_id', message: 'La facultad indicada no existe' },
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
            message: 'Ya existe un bloque con el mismo codigo',
          },
        ],
      },
    },
  })
  async create(@Body() dto: CreateBloqueDto) {
    const { id } = await this.createBloque.execute({
      codigo: dto.codigo,
      nombre: dto.nombre,
      nombre_corto: dto.nombre_corto ?? null,
      lat: dto.lat,
      lng: dto.lng,
      pisos: dto.pisos,
      activo: dto.activo,
      facultad_id: dto.facultad_id,
      tipo_bloque_id: dto.tipo_bloque_id,
    });

    return { id };
  }
}

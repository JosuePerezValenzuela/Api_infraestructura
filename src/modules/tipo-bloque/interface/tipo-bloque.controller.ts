import { Controller, HttpCode, HttpStatus, Post, Body } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateTipoBloqueUseCase } from '../application/create-tipo-bloque.usecase';
import { CreateTipoBloqueDto } from './dto/create-tipo-bloque.dto';

@ApiTags('Tipo de Bloques')
@Controller('tipo_bloques')
export class TipoBloqueController {
  constructor(private readonly createTipoBloque: CreateTipoBloqueUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un nuevo tipo de bloque' })
  @ApiBody({ type: CreateTipoBloqueDto })
  @ApiCreatedResponse({
    description: 'Tipo de bloque creado',
    schema: { example: { id: 1 } },
  })
  @ApiBadRequestResponse({
    description: 'Datos invalidos',
    schema: {
      example: {
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          { field: 'nombre', message: 'El nombre no puede estar vacio' },
        ],
      },
    },
  })
  @ApiConflictResponse({
    description: 'Nombre duplicado',
    schema: {
      example: {
        error: 'CONFLICT_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          {
            field: 'nombre',
            message: 'Ya existe un tipo de bloque con ese nombre',
          },
        ],
      },
    },
  })
  async create(@Body() dto: CreateTipoBloqueDto) {
    const { id } = await this.createTipoBloque.execute({
      nombre: dto.nombre,
      descripcion: dto.descripcion,
    });
    return { id };
  }
}

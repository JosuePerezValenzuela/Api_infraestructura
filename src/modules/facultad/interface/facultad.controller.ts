import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateFacultadUseCase } from '../application/create-facultad.usecase';
import { CreateFacultadDto } from './dto/create-facultad.dto';
import { CreateFacultadCommand } from '../application/dto/create-facultad.command';

@ApiTags('Facultades')
@Controller('facultades')
export class FacultadController {
  constructor(private readonly createFacultad: CreateFacultadUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar una nueva facultad' })
  @ApiCreatedResponse({
    description: 'Facultad creada',
    schema: { example: { id: 1 } },
  })
  @ApiBadRequestResponse({
    description: 'Datos iinvalidos o relaciones inexistentes',
    schema: {
      example: {
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          { field: 'campus_id', message: 'El campus indicado no existe' },
        ],
      },
    },
  })
  async create(@Body() dto: CreateFacultadDto) {
    const command = new CreateFacultadCommand({
      codigo: dto.codigo,
      nombre: dto.nombre,
      nombre_corto: dto.nombre_corto ?? null,
      lat: dto.lat,
      lng: dto.lng,
      campus_id: dto.campus_id,
    });

    const { id } = await this.createFacultad.execute(command);

    return id;
  }
}

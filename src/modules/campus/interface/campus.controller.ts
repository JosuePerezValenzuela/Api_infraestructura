import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { CreateCampusUseCase } from '../application/create-campus.usecase';
import { CreateCampusDto } from './dto/create-campus.dto';

@ApiTags('Campus')
@Controller('campus')
export class CampusController {
  constructor(private readonly createCampus: CreateCampusUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un campus' })
  @ApiCreatedResponse({
    description: 'Campus creado correctamente',
    schema: { example: { id: 1 } },
  })
  @ApiBadRequestResponse({ description: 'Datos invalidos ' })
  async create(@Body() dto: CreateCampusDto) {
    const { id } = await this.createCampus.execute({
      nombre: dto.nombre,
      direccion: dto.direccion,
      lat: dto.lat,
      lng: dto.lng,
    });
    return { id };
  }
}

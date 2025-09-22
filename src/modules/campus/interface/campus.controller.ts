import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CreateCampusUseCase } from '../application/create-campus.usecase';
import { CreateCampusDto } from './dto/create-campus.dto';

@Controller('campus')
export class CampusController {
  constructor(private readonly createCampus: CreateCampusUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
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

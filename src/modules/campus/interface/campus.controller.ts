import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Get, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { CreateCampusUseCase } from '../application/create-campus.usecase';
import { CreateCampusDto } from './dto/create-campus.dto';
import { ListCampusQueryDto } from './dto/list-campus.query';
import { ListCampusUseCase } from '../application/list-campus.usecase';

@ApiTags('Campus')
@Controller('campus')
export class CampusController {
  constructor(
    private readonly createCampus: CreateCampusUseCase,
    private readonly listCampus: ListCampusUseCase,
  ) {}

  @Get()
  async list(@Query() query: ListCampusQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const result = await this.listCampus.execute({
      skip: (page - 1) * limit,
      take: limit,
      search: query.search,
      orderBy: query.orderBy ?? 'nombre',
      direction: query.orderDir ?? 'asc',
    });

    return {
      ...result,
      page,
      limit,
    };
  }

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

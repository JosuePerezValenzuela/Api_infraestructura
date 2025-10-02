import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { Get, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiParam,
  ApiBody,
  ApiOkResponse,
} from '@nestjs/swagger';
import { CreateCampusUseCase } from '../application/create-campus.usecase';
import { CreateCampusDto } from './dto/create-campus.dto';
import { ListCampusQueryDto } from './dto/list-campus.query';
import { ListCampusUseCase } from '../application/list-campus.usecase';
import { UpdateCampusUseCase } from '../application/update-campus.usecase';
import { UpdateCampusDto } from './dto/update-campus.dto';
import { NotFoundException, ConflictException } from '@nestjs/common';

@ApiTags('Campus')
@Controller('campus')
export class CampusController {
  constructor(
    private readonly createCampus: CreateCampusUseCase,
    private readonly listCampus: ListCampusUseCase,
    private readonly UpdateCampus: UpdateCampusUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Listar los campus' })
  @ApiCreatedResponse({
    description: 'Listado correctamente',
    schema: {
      example: {
        items: [
          {
            id: 1,
            codigo: '1565789',
            nombre: 'Campus central',
            direccion: 'Av Sucre entre Belzu y Oquendo',
            lat: 15,
            lng: 15,
            activo: true,
            creando_en: '2025-09-24T15:20:30.767Z',
            actualizado_en: '2025-09-24T15:20:30.767Z',
          },
        ],
        meta: {
          total: 50,
          page: 1,
          take: 1,
          hasNextPage: true,
          hasPreviousPage: false,
        },
      },
    },
  })
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
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un campus' })
  @ApiCreatedResponse({
    description: 'Campus creado correctamente',
    schema: { example: { id: 1 } },
  })
  @ApiBadRequestResponse({
    description: 'Datos invalidos ',
    schema: {
      example: {
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son válidos',
        details: [
          {
            field: 'direccion',
            message: 'No se ingreso el campo direccion',
          },
        ],
      },
    },
  })
  async create(@Body() dto: CreateCampusDto) {
    const { id } = await this.createCampus.execute({
      codigo: dto.codigo,
      nombre: dto.nombre,
      direccion: dto.direccion,
      lat: dto.lat,
      lng: dto.lng,
    });
    return { id };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un campus por ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateCampusDto })
  @ApiOkResponse({ description: 'Devuelve el id' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCampusDto,
  ) {
    try {
      const { idResp } = await this.UpdateCampus.execute({ id, data: dto });
      return { id: idResp };
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw new HttpException(err.message, HttpStatus.NOT_FOUND);
      }
      if (err instanceof ConflictException) {
        throw new HttpException(err.message, HttpStatus.CONFLICT);
      }
      if (err instanceof BadRequestException) {
        throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
      }
      throw new HttpException('Eror interno', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
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
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { CreateCampusUseCase } from '../application/create-campus.usecase';
import { CreateCampusDto } from './dto/create-campus.dto';
import { ListCampusQueryDto } from './dto/list-campus.query';
import { ListCampusUseCase } from '../application/list-campus.usecase';
import { UpdateCampusUseCase } from '../application/update-campus.usecase';
import { UpdateCampusDto } from './dto/update-campus.dto';
import { DeleteCampusDTO } from './dto/delete-campus.dto';
import { DeleteCampusUseCase } from '../application/delete-campus.usecase';
import { NotFoundException, ConflictException } from '@nestjs/common';

@ApiTags('Campus')
@Controller('campus')
export class CampusController {
  constructor(
    private readonly createCampus: CreateCampusUseCase,
    private readonly listCampus: ListCampusUseCase,
    private readonly updateCampus: UpdateCampusUseCase,
    private readonly deleteCampus: DeleteCampusUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar los campus' })
  @ApiOkResponse({
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
    const activo = query.activo;

    const result = await this.listCampus.execute({
      skip: (page - 1) * limit,
      take: limit,
      search: query.search,
      orderBy: query.orderBy ?? 'nombre',
      direction: query.orderDir ?? 'asc',
      activo,
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
  @ApiBadRequestResponse({
    description: 'Datos invalidos ',
    schema: {
      example: {
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son válidos',
        details: [
          {
            field: 'codigo',
            message: 'El codigo debe ser una cadena',
          },
        ],
      },
    },
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCampusDto,
  ) {
    try {
      const { idResp } = await this.updateCampus.execute({ id, data: dto });
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
      throw new HttpException(
        'Error interno',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Elimina un campus por ID (delete físico)' })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID del campus a eliminar',
  })
  @ApiNoContentResponse({
    description:
      'El campus fue eliminado físicamente (sin cuerpo en respuesta)',
  })
  @ApiNotFoundResponse({
    description: 'Campus no encontrado',
    schema: {
      example: {
        statusCode: 404,
        message: 'No se encontro el campus',
        error: 'Not Found',
      },
    },
  })
  @ApiConflictResponse({
    description: 'No se puede eliminar - tiene facultades relacionadas',
    schema: {
      example: {
        error: 'CONFLICT_ERROR',
        message:
          'No se puede eliminar el campus porque tiene facultades relacionadas',
        details: [
          {
            field: 'facultades',
            message:
              'Facultad "Facultad de Ingeniería" (FAC-001) está relacionada con este campus',
            faculty: {
              id: 1,
              codigo: 'FAC-001',
              nombre: 'Facultad de Ingeniería',
              nombre_corto: 'FI',
              activo: true,
            },
          },
          {
            field: 'facultades',
            message:
              'Facultad "Facultad de Medicina" (FAC-002) está relacionada con este campus',
            faculty: {
              id: 2,
              codigo: 'FAC-002',
              nombre: 'Facultad de Medicina',
              nombre_corto: 'FM',
              activo: false,
            },
          },
        ],
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos',
    schema: {
      example: {
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son válidos',
        details: [
          {
            field: 'id',
            message: 'El id debe ser un número',
          },
        ],
      },
    },
  })
  async deleteById(@Param() dto: DeleteCampusDTO) {
    try {
      const resp = await this.deleteCampus.execute({ id: dto.id });
      return resp;
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw new HttpException(err.message, HttpStatus.NOT_FOUND);
      }
      if (err instanceof ConflictException) {
        throw new HttpException(err.getResponse(), HttpStatus.CONFLICT);
      }
      throw new HttpException('Eror interno', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

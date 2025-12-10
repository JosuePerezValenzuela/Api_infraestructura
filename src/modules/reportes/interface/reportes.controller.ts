import {
  Controller,
  Get,
  Query,
  Res,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiProduces,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { GenerarReporteInventarioService } from '../application/generar-reporte-inventario.service';
import { GenerarReporteInventarioDto } from './dto/generar-reporte-inventario.dto';

@ApiTags('reportes')
@Controller('reportes')
export class ReportesController {
  constructor(
    private readonly generarReporteInventarioService: GenerarReporteInventarioService,
  ) {}

  @Get('inventario-ambientes')
  @ApiQuery({
    name: 'scope',
    enum: ['campus', 'facultad', 'bloque'],
    required: true,
  })
  @ApiQuery({
    name: 'scopeId',
    required: true,
    description: 'Identificador del scope',
  })
  @ApiQuery({ name: 'formato', enum: ['xlsx', 'pdf'], required: true })
  @ApiProduces(
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  @ApiProduces('application/pdf')
  @ApiOkResponse({
    description: 'Reporte generado',
    content: {
      'application/pdf': { schema: { type: 'string', format: 'binary' } },
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
        schema: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Validación o formato no soportado' })
  @ApiNotFoundResponse({ description: 'Recurso no encontrado' })
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  )
  async generarReporte(
    @Query() dto: GenerarReporteInventarioDto,
    @Res() res: Response,
  ) {
    const archivo = await this.generarReporteInventarioService.ejecutar(dto);
    res.setHeader('Content-Type', archivo.mime_type);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${archivo.filename}"`,
    );
    return archivo.stream.pipe(res);
  }
}

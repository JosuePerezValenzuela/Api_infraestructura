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
import { GenerarReporteAmbienteService } from '../application/generar-reporte-ambiente.service';
import { GenerarReporteInventarioDto } from './dto/generar-reporte-inventario.dto';
import {
  GenerarReporteAmbienteDto,
  ReporteAmbienteFormato,
} from './dto/generar-reporte-ambiente.dto';

@ApiTags('reportes')
@Controller('reportes')
export class ReportesController {
  constructor(
    private readonly generarReporteInventarioService: GenerarReporteInventarioService,
    private readonly generarReporteAmbienteService: GenerarReporteAmbienteService,
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

  @Get('ambiente')
  @ApiQuery({
    name: 'codigo',
    required: true,
    description: 'Codigo del ambiente (ej: FCyT-001)',
  })
  @ApiQuery({
    name: 'formato',
    enum: [ReporteAmbienteFormato.PDF, ReporteAmbienteFormato.EXCEL],
    required: true,
  })
  @ApiProduces('application/pdf')
  @ApiProduces(
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  @ApiOkResponse({
    description: 'Reporte de ambiente generado',
    content: {
      'application/pdf': { schema: { type: 'string', format: 'binary' } },
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
        schema: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Validacion o formato no soportado' })
  @ApiNotFoundResponse({ description: 'Ambiente no encontrado' })
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  )
  async generarReporteAmbiente(
    @Query() dto: GenerarReporteAmbienteDto,
    @Res() res: Response,
  ) {
    const archivo = await this.generarReporteAmbienteService.ejecutar(dto);
    res.setHeader('Content-Type', archivo.mime_type);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${archivo.filename}"`,
    );
    return archivo.stream.pipe(res);
  }
}

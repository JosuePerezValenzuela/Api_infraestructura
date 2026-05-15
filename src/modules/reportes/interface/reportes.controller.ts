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
import {
  GenerarReporteInventarioDto,
  ReporteFormato,
} from './dto/generar-reporte-inventario.dto';

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
  @ApiOkResponse({
    description: 'XLSX → archivo binario. PDF → JSON con datos del reporte',
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
    if (dto.formato === ReporteFormato.XLSX) {
      // === XLSX → devolver archivo binario ===
      const archivo =
        await this.generarReporteInventarioService.ejecutar(dto);
      res.setHeader('Content-Type', archivo.mime_type);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${archivo.filename}"`,
      );
      return archivo.stream.pipe(res);
    }

    // === PDF → devolver JSON con los datos (frontend genera el PDF) ===
    // Se eliminan los kpis del view-model antes de enviarlo
    const datos =
      await this.generarReporteInventarioService.obtener_datos_json(dto);
    const datos_sin_kpis = this.removerKpis(datos);
    return res.json(datos_sin_kpis);
  }

  /**
   * Recorre el view-model y elimina la propiedad `kpis` de cada nivel.
   * Los KPIs se usaban para generar el PDF en backend; ahora el frontend
   * los calcula si los necesita.
   */
  private removerKpis(
    data: Record<string, unknown>,
  ): Record<string, unknown> {
    return JSON.parse(
      JSON.stringify(data, (_key, value) => {
        if (_key === 'kpis') return undefined;
        return value;
      }),
    ) as Record<string, unknown>;
  }
}

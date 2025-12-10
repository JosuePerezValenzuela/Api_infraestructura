import {
  Controller,
  Get,
  Query,
  Res,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import type { Response } from 'express';
import { GenerarReporteInventarioService } from '../application/generar-reporte-inventario.service';
import { GenerarReporteInventarioDto } from './dto/generar-reporte-inventario.dto';

@Controller('reportes')
export class ReportesController {
  constructor(
    private readonly generarReporteInventarioService: GenerarReporteInventarioService,
  ) {}

  @Get('inventario-ambientes')
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

import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { InventarioReporteRepository } from '../domain/ports/inventario-reporte.repository';
import type {
  ReporteGeneradorPort,
  ArchivoReporte,
} from '../domain/ports/reporte-generador.port';
import type { InventarioReporteViewModel } from '../domain/models/inventario.view-model';
import {
  GenerarReporteInventarioDto,
  ReporteFormato,
  ReporteScope,
} from '../interface/dto/generar-reporte-inventario.dto';

@Injectable()
export class GenerarReporteInventarioService {
  constructor(
    @Inject('InventarioReporteRepository')
    private readonly inventario_repo: InventarioReporteRepository,
    @Inject('ReporteGeneradorPort')
    private readonly generador: ReporteGeneradorPort,
  ) {}

  async ejecutar(dto: GenerarReporteInventarioDto): Promise<ArchivoReporte> {
    const view_model = await this.obtener_view_model(dto);
    if (
      !view_model ||
      (!view_model.campus && !view_model.facultad && !view_model.bloque)
    ) {
      throw new NotFoundException({
        error: 'NOT_FOUND',
        message: 'No se encontró el recurso solicitado',
      });
    }

    if (dto.formato === ReporteFormato.XLSX) {
      return this.generador.generar_xlsx(view_model);
    }
    if (dto.formato === ReporteFormato.PDF) {
      return this.generador.generar_pdf(view_model);
    }
    throw new BadRequestException({
      error: 'VALIDATION_ERROR',
      message: 'Los datos enviados no son validos',
      details: [
        {
          field: 'formato',
          message: 'Formato no soportado, use xlsx o pdf',
        },
      ],
    });
  }

  private obtener_view_model(
    dto: GenerarReporteInventarioDto,
  ): Promise<InventarioReporteViewModel | null> {
    if (dto.scope === ReporteScope.CAMPUS) {
      return this.inventario_repo.obtener_por_campus(dto.scopeId);
    }
    if (dto.scope === ReporteScope.FACULTAD) {
      return this.inventario_repo.obtener_por_facultad(dto.scopeId);
    }
    if (dto.scope === ReporteScope.BLOQUE) {
      return this.inventario_repo.obtener_por_bloque(dto.scopeId);
    }
    throw new BadRequestException({
      error: 'VALIDATION_ERROR',
      message: 'Los datos enviados no son validos',
      details: [
        {
          field: 'scope',
          message: 'Scope no soportado, use campus, facultad o bloque',
        },
      ],
    });
  }
}

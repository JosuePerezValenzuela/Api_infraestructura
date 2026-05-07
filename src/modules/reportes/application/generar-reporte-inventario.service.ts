import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
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

    // 404 si no hay nada para ese scope/scopeId
    if (
      !view_model ||
      (!view_model.campus && !view_model.facultad && !view_model.bloque)
    ) {
      throw new NotFoundException({
        error: 'NOT_FOUND',
        message: 'No se encontró el recurso solicitado',
      });
    }

    // Sanitizar errores internos del generador (XLSX/PDF)
    try {
      switch (dto.formato) {
        case ReporteFormato.XLSX:
          return await this.generador.generar_xlsx(view_model);

        case ReporteFormato.PDF:
          return await this.generador.generar_pdf(view_model);

        default:
          // Protección extra por si algún día se llama al usecase
          // programáticamente sin pasar por la validación del DTO.
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
    } catch (err) {
      // Aquí podrías loggear el error real con Logger si quieres
      console.log(err);
      throw new InternalServerErrorException({
        error: 'INTERNAL_ERROR',
        message: 'Ocurrió un error al generar el reporte de inventario',
      });
    }
  }

  private obtener_view_model(
    dto: GenerarReporteInventarioDto,
  ): Promise<InventarioReporteViewModel | null> {
    switch (dto.scope) {
      case ReporteScope.CAMPUS:
        return this.inventario_repo.obtener_por_campus(dto.scopeId);

      case ReporteScope.FACULTAD:
        return this.inventario_repo.obtener_por_facultad(dto.scopeId);

      case ReporteScope.BLOQUE:
        return this.inventario_repo.obtener_por_bloque(dto.scopeId);

      default:
        // En teoría no llega aquí por el IsEnum del DTO,
        // pero lo dejamos para robustez y tests unitarios.
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
}

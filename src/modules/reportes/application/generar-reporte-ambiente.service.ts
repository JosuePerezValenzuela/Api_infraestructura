import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { AmbienteReporteRepository } from '../domain/ports/ambiente-reporte.repository';
import type { ReporteAmbienteGeneradorPort } from '../domain/ports/ambiente-reporte-generador.port';
import { ReporteAmbienteFormato } from '../interface/dto/generar-reporte-ambiente.dto';
import { buildDisponibilidadMatriz } from '../domain/models/disponibilidad-matriz';
import type { ArchivoReporte } from '../domain/ports/reporte-generador.port';

@Injectable()
export class GenerarReporteAmbienteService {
  constructor(
    @Inject('AmbienteReporteRepository')
    private readonly repo: AmbienteReporteRepository,
    @Inject('ReporteAmbienteGeneradorPort')
    private readonly generador: ReporteAmbienteGeneradorPort,
  ) {}

  // Metodo principal que orquesta el flujo: obtiene datos, arma matriz y delega al generador.
  async ejecutar(params: {
    id: number;
    formato: ReporteAmbienteFormato;
  }): Promise<ArchivoReporte> {
    const viewModel = await this.repo.obtenerPorId(params.id);

    // Si no hay datos, devolvemos un 404 coherente con el contrato global de errores.
    if (!viewModel) {
      throw new NotFoundException({
        error: 'NOT_FOUND',
        message: 'No se encontro el ambiente solicitado',
      });
    }

    // Calculamos la matriz Horas-Lunes...Domingo usando los horarios de operacion.
    // Determinamos el rango global (apertura minima y cierre maxima) desde los horarios.
    const toMinutes = (hhmm: string): number => {
      const [h, m] = hhmm.split(':').map(Number);
      return h * 60 + m;
    };

    const horarios = viewModel.horarios;
    let horaApertura = '00:00';
    let horaCierre = '00:00';
    let periodo = 60;

    if (horarios.length > 0) {
      // Obtener apertura minima y cierre maxima
      horaApertura = horarios.reduce((min, h) =>
        toMinutes(h.hora_inicio) < toMinutes(min.hora_inicio) ? h : min,
      ).hora_inicio;
      horaCierre = horarios.reduce((max, h) =>
        toMinutes(h.hora_fin) > toMinutes(max.hora_fin) ? h : max,
      ).hora_fin;
      // Obtener periodo del primer horario (todos tienen el mismo)
      periodo = 45; // valor por defecto, el trigger de BD asegura que todos lo tengan
    }

    const disponibilidadMatriz = buildDisponibilidadMatriz({
      horaApertura,
      horaCierre,
      periodo,
      franjas: horarios,
    });

    // Componemos un nuevo view-model incluyendo la matriz calculada.
    const enrichedViewModel = { ...viewModel, disponibilidadMatriz }; // agregamos la matriz para que el generador la use en el render

    // Delegamos al generador segun el formato solicitado, manejando errores internos.
    try {
      if (params.formato === ReporteAmbienteFormato.PDF) {
        // Si el usuario pidio PDF, llamamos al generador PDF con el view-model completo.
        return await this.generador.generar_pdf(enrichedViewModel);
      }

      if (params.formato === ReporteAmbienteFormato.EXCEL) {
        // Si el usuario pidio Excel, llamamos al generador Excel con el mismo view-model.
        return await this.generador.generar_excel(enrichedViewModel);
      }

      // Si llegamos aqui, el formato no es soportado (proteccion extra).
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son validos',
        details: [
          {
            field: 'formato',
            message: 'Formato no soportado, use pdf o excel',
          },
        ],
      });
    } catch (err) {
      // En caso de error interno del generador, devolvemos un 500 controlado.
      throw new InternalServerErrorException({
        error: 'INTERNAL_ERROR',
        message: 'Ocurrio un error al generar el reporte del ambiente' + err,
      });
    }
  }
}

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
    codigo: string;
    formato: ReporteAmbienteFormato;
  }): Promise<ArchivoReporte> {
    // Obtenemos el detalle del ambiente por su codigo; si no existe devolvera null.
    const viewModel = await this.repo.obtenerPorCodigo(params.codigo); // llamamos al puerto del repositorio con el codigo recibido

    // Si no hay datos, devolvemos un 404 coherente con el contrato global de errores.
    if (!viewModel) {
      throw new NotFoundException({
        error: 'NOT_FOUND',
        message: 'No se encontro el ambiente solicitado',
      });
    }

    // Calculamos la matriz Horas-Lunes...Domingo usando las franjas y el periodo del ambiente.
    const disponibilidadMatriz = buildDisponibilidadMatriz({
      horaApertura: viewModel.ambiente.hora_apertura ?? '00:00', // hora desde donde comienza la tabla; si viene nulo usamos 00:00 para no romper
      horaCierre: viewModel.ambiente.hora_cierre ?? '00:00', // hora donde termina la tabla; si viene nulo usamos 00:00
      periodo: viewModel.ambiente.periodo ?? 60, // salto en minutos entre filas; si no existe asumimos 60 min
      franjas: viewModel.horarios, // lista de intervalos disponibles por dia
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

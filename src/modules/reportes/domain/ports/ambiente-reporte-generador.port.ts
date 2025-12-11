import type { ArchivoReporte } from './reporte-generador.port';
import type { AmbienteDetalleViewModel } from './ambiente-reporte.repository';

// Port para generar el reporte de detalle de ambiente en los formatos soportados.
export interface ReporteAmbienteGeneradorPort {
  generar_pdf(view_model: AmbienteDetalleViewModel): Promise<ArchivoReporte>;
  generar_excel(view_model: AmbienteDetalleViewModel): Promise<ArchivoReporte>;
}

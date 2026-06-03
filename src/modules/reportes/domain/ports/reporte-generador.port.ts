import type { Readable } from 'stream';
import type { InventarioReporteViewModel } from '../models/inventario.view-model';

export interface ArchivoReporte {
  stream: Readable;
  filename: string;
  mime_type: string;
}

export interface ReporteGeneradorPort {
  generar_xlsx(view_model: InventarioReporteViewModel): Promise<ArchivoReporte>;
  generar_pdf(view_model: InventarioReporteViewModel): Promise<ArchivoReporte>;
}

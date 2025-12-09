import { InventarioReporteViewModel } from '../models/inventario.view-model';

export interface InventarioReporteRepository {
  obtener_por_campus(
    campus_id: string,
  ): Promise<InventarioReporteViewModel | null>;
  obtener_por_facultad(
    facultad_id: string,
  ): Promise<InventarioReporteViewModel | null>;
  obtener_por_bloque(
    bloque_id: string,
  ): Promise<InventarioReporteViewModel | null>;
}

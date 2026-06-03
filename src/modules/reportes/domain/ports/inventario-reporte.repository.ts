import type { InventarioReporteViewModel } from '../models/inventario.view-model';

export interface InventarioReporteRepository {
  obtener_por_campus(
    campus_id: number,
  ): Promise<InventarioReporteViewModel | null>;
  obtener_por_facultad(
    facultad_id: number,
  ): Promise<InventarioReporteViewModel | null>;
  obtener_por_bloque(
    bloque_id: number,
  ): Promise<InventarioReporteViewModel | null>;
}

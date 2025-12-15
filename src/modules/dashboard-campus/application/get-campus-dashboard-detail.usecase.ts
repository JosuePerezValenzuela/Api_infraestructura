import { Injectable } from '@nestjs/common';
import {
  DashboardDetailFilters,
  DashboardDetailResult,
} from '../domain/dashboard-campus.types';

@Injectable()
export class GetCampusDashboardDetailUseCase {
  // Este metodo construye la respuesta placeholder del dashboard de detalle usando los filtros ya validados.
  async execute(
    filters: DashboardDetailFilters,
  ): Promise<DashboardDetailResult> {
    // Guardamos el identificador del campus porque lo reutilizaremos en la seccion filtersApplied.
    const campusId = filters.campusId;
    // Guardamos el valor de includeInactive ya validado para no recalcularlo.
    const includeInactive = filters.includeInactive;
    // Armamos el objeto de salida con version fija y estructuras vacias que el frontend llenara en futuras HUs.
    const response: DashboardDetailResult = {
      schemaVersion: 1,
      filtersApplied: {
        campusId,
        includeInactive,
      },
      layout: { mode: 'detail' },
      data: {
        kpis: {},
        charts: {},
        tables: { facultades: { rows: [] } },
      },
    };
    // Devolvemos la respuesta para que el controlador la entregue al cliente HTTP.
    return response;
  }
}

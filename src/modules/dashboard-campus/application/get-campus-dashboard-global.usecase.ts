import { Injectable } from '@nestjs/common';
import {
  DashboardGlobalFilters,
  DashboardGlobalResult,
} from '../domain/dashboard-campus.types';

@Injectable()
export class GetCampusDashboardGlobalUseCase {
  // Este metodo arma la respuesta placeholder del dashboard global a partir de los filtros ya validados.
  async execute(
    filters: DashboardGlobalFilters,
  ): Promise<DashboardGlobalResult> {
    // Guardamos el valor de includeInactive que llega validado para reutilizarlo sin recalcularlo.
    const includeInactive = filters.includeInactive;
    // Construimos el objeto de salida con la version fija y datos vacios para que el frontend pueda montar el layout.
    const response: DashboardGlobalResult = {
      schemaVersion: 1,
      filtersApplied: {
        campusIds: filters.campusIds,
        includeInactive,
      },
      layout: { mode: 'global' },
      data: { kpis: {}, charts: {}, table: { rows: [] } },
    };
    // Retornamos la respuesta lista para ser devuelta por el controlador.
    return response;
  }
}

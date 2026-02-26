import { Injectable } from '@nestjs/common';
import {
  DashboardFacultadDetailFilters,
  DashboardFacultadDetailResult,
} from '../domain/dashboard-facultad.types';

@Injectable()
export class GetFacultadDashboardDetailUseCase {
  // Este metodo se definio para que el controlador pueda delegar la ejecucion del caso de uso detalle.
  async execute(
    filters: DashboardFacultadDetailFilters,
  ): Promise<DashboardFacultadDetailResult> {
    // En esta etapa inicial devolvemos un error porque aun no se implemento el repositorio real.
    throw new Error(
      `Not implemented yet. Received filters: ${JSON.stringify(filters)}`,
    );
  }
}

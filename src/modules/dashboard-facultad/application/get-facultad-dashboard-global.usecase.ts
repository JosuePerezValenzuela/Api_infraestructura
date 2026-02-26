import { Injectable } from '@nestjs/common';
import {
  DashboardFacultadGlobalFilters,
  DashboardFacultadGlobalResult,
} from '../domain/dashboard-facultad.types';

@Injectable()
export class GetFacultadDashboardGlobalUseCase {
  // Este metodo se definio para que el controlador pueda delegar la ejecucion del caso de uso global.
  async execute(
    filters: DashboardFacultadGlobalFilters,
  ): Promise<DashboardFacultadGlobalResult> {
    // En esta etapa inicial devolvemos un error porque aun no se implemento el repositorio real.
    throw new Error(
      `Not implemented yet. Received filters: ${JSON.stringify(filters)}`,
    );
  }
}

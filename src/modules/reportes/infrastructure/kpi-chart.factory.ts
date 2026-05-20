import { Injectable, Logger } from '@nestjs/common';

/**
 * Factory for KPI charts.
 *
 * NOTE: chart generation (canvas / chartjs-node-canvas) was removed
 * to avoid native compilation complexity in Docker builds.
 * Methods return null; callers should handle the absence gracefully.
 */
@Injectable()
export class KpiChartFactory {
  private static readonly logger = new Logger(KpiChartFactory.name);

  constructor() {
    KpiChartFactory.logger.log(
      'KpiChartFactory initialized (chart generation disabled).',
    );
  }

  /**
   * Returns null — chart generation is currently disabled.
   */
  async buildEstadoDonut(_params: {
    title: string;
    activos: number;
    inactivos: number;
  }): Promise<Buffer | null> {
    return null;
  }
}

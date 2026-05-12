import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource } from 'typeorm';

/**
 * Servicio que gestiona las Materialized Views del dashboard.
 * Refresca las vistas cada 5 minutos para mantener los datos actualizados.
 */
@Injectable()
export class DashboardCacheService {
  private readonly logger = new Logger(DashboardCacheService.name);

  constructor(private readonly dataSource: DataSource) {}

  /**
   * Refresca todas las Materialized Views del dashboard.
   * Se ejecuta automáticamente cada 30 minutos entre las 9 AM y las 5 PM.
   */
  @Cron(CronExpression.EVERY_30_MINUTES_BETWEEN_9AM_AND_5PM)
  async refreshAllMaterializedViews(): Promise<void> {
    this.logger.log('Refrescando Materialized Views del dashboard...');

    try {
      await this.refreshMaterializedViews();
      this.logger.log('Materialized Views actualizadas correctamente');
    } catch (error) {
      this.logger.error('Error al refrescar Materialized Views', error);
    }
  }

  /**
   * Refresca manualmente las Materialized Views.
   * Las que tienen índice único usan CONCURRENTLY (no bloquea).
   * Las que no tienen índice usan REFRESH sin CONCURRENTLY.
   */
  async refreshMaterializedViews(): Promise<void> {
    // Estas tienen índice único → CONCURRENTLY
    await this.dataSource.query(
      `REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_campus_resumen`,
    );
    await this.dataSource.query(
      `REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_tipos_bloque`,
    );
    await this.dataSource.query(
      `REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_tipos_ambiente`,
    );
    // Esta NO tiene índice único → sin CONCURRENTLY (es solo 1 fila de todos modos)
    await this.dataSource.query(
      `REFRESH MATERIALIZED VIEW mv_dashboard_activos_no_asignados`,
    );
  }

  /**
   * Refresca sin CONCURRENTLY (más rápido pero bloquea la vista).
   * Usar solo si hay problemas con CONCURRENTLY.
   */
  async refreshMaterializedViewsNonConcurrent(): Promise<void> {
    await this.dataSource.query(
      `REFRESH MATERIALIZED VIEW mv_dashboard_campus_resumen`,
    );
    await this.dataSource.query(
      `REFRESH MATERIALIZED VIEW mv_dashboard_tipos_bloque`,
    );
    await this.dataSource.query(
      `REFRESH MATERIALIZED VIEW mv_dashboard_tipos_ambiente`,
    );
    await this.dataSource.query(
      `REFRESH MATERIALIZED VIEW mv_dashboard_activos_no_asignados`,
    );
  }

  /**
   * Verifica el estado de las Materialized Views.
   * Útil para debugging.
   */
  async checkViewsStatus(): Promise<
    {
      lastRefresh: Date | null;
      viewName: string;
    }[]
  > {
    const views = [
      'mv_dashboard_campus_resumen',
      'mv_dashboard_tipos_bloque',
      'mv_dashboard_tipos_ambiente',
      'mv_dashboard_activos_no_asignados',
    ];

    const results = await Promise.all(
      views.map(async (view) => {
        const result = await this.dataSource.query(
          `SELECT pg_get_viewdef('${view}', true) AS definition`,
        );
        return {
          viewName: view,
          lastRefresh: null, // PostgreSQL no guarda esto directamente
        };
      }),
    );

    return results;
  }
}

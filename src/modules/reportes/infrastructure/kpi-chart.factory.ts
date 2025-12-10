/* eslint-disable @typescript-eslint/no-require-imports */

import { Injectable, Logger } from '@nestjs/common';
import type { ChartConfiguration } from 'chart.js';

type ChartJSNodeCanvasType = {
  new (options: { width: number; height: number; backgroundColour?: string }): {
    renderToBuffer: (config: ChartConfiguration<'doughnut'>) => Promise<Buffer>;
  };
};

@Injectable()
export class KpiChartFactory {
  private static readonly logger = new Logger(KpiChartFactory.name);

  private chart: InstanceType<ChartJSNodeCanvasType> | null = null;
  private enabled = false;

  constructor() {
    try {
      // Import dinámico para poder capturar errores de canvas / chartjs-node-canvas
      const mod = require('chartjs-node-canvas') as {
        ChartJSNodeCanvas: ChartJSNodeCanvasType;
      };

      const { ChartJSNodeCanvas } = mod;

      this.chart = new ChartJSNodeCanvas({
        width: 260,
        height: 260,
        backgroundColour: 'white',
      });
      this.enabled = true;

      KpiChartFactory.logger.log(
        'Librería chartjs-node-canvas inicializada correctamente para KPIs.',
      );
    } catch (err) {
      this.enabled = false;
      this.chart = null;

      const message =
        err instanceof Error ? err.message : String(err ?? 'Error desconocido');
      KpiChartFactory.logger.warn(
        `No se pudo inicializar chartjs-node-canvas. Los reportes se generarán sin gráficos. Detalle: ${message}`,
      );
    }
  }

  /**
   * Genera un gráfico tipo donut con activos vs inactivos.
   * Si chartjs-node-canvas/canvas no está disponible, devuelve null
   * y el llamador debe omitir el gráfico.
   */
  async buildEstadoDonut(params: {
    title: string;
    activos: number;
    inactivos: number;
  }): Promise<Buffer | null> {
    if (!this.enabled || !this.chart) {
      // Fallback: sin gráficos
      return null;
    }

    const { title, activos, inactivos } = params;
    const data = [activos ?? 0, inactivos ?? 0];

    const configuration: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels: ['Activos', 'Inactivos'],
        datasets: [
          {
            data,
            backgroundColor: ['#2a9d8f', '#e76f51'],
            borderWidth: 1,
          },
        ],
      },
      options: {
        plugins: {
          title: {
            display: true,
            text: title,
          },
          legend: {
            position: 'bottom',
          },
        },
        cutout: '60%',
      },
    };

    return await this.chart.renderToBuffer(configuration);
  }
}

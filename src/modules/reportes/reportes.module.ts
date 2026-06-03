import { Module } from '@nestjs/common';

import { ReportesController } from './interface/reportes.controller';
import { GenerarReporteInventarioService } from './application/generar-reporte-inventario.service';
import { InventarioReporteRepositoryAdapter } from './infrastructure/repositories/inventario-reporte.repository';
import { ReporteGeneradorAdapter } from './infrastructure/generators/reporte-generador.adapter';
import { KpiChartFactory } from './infrastructure/kpi-chart.factory';

@Module({
  controllers: [ReportesController],
  providers: [
    GenerarReporteInventarioService,
    KpiChartFactory,
    {
      provide: 'InventarioReporteRepository',
      useClass: InventarioReporteRepositoryAdapter,
    },
    { provide: 'ReporteGeneradorPort', useClass: ReporteGeneradorAdapter },
  ],
})
export class ReportesModule {}

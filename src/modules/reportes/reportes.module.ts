import { Module } from '@nestjs/common';

import { ReportesController } from './interface/reportes.controller';
import { GenerarReporteInventarioService } from './application/generar-reporte-inventario.service';
import { GenerarReporteAmbienteService } from './application/generar-reporte-ambiente.service';
import { InventarioReporteRepositoryAdapter } from './infrastructure/repositories/inventario-reporte.repository';
import { AmbienteReporteRepositoryAdapter } from './infrastructure/repositories/ambiente-reporte.repository';
import { ReporteGeneradorAdapter } from './infrastructure/generators/reporte-generador.adapter';
import { ReporteAmbienteGeneradorAdapter } from './infrastructure/generators/reporte-ambiente-generador.adapter';
import { KpiChartFactory } from './infrastructure/kpi-chart.factory';

@Module({
  controllers: [ReportesController],
  providers: [
    GenerarReporteInventarioService,
    GenerarReporteAmbienteService,
    KpiChartFactory,
    {
      provide: 'InventarioReporteRepository',
      useClass: InventarioReporteRepositoryAdapter,
    },
    { provide: 'ReporteGeneradorPort', useClass: ReporteGeneradorAdapter },
    {
      provide: 'AmbienteReporteRepository',
      useClass: AmbienteReporteRepositoryAdapter,
    },
    {
      provide: 'ReporteAmbienteGeneradorPort',
      useClass: ReporteAmbienteGeneradorAdapter,
    },
  ],
})
export class ReportesModule {}

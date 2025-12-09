import { Module } from '@nestjs/common';
import { ReportesController } from './interface/reportes.controller';
import { GenerarReporteInventarioService } from './application/generar-reporte-inventario.service';

@Module({
  controllers: [ReportesController],
  providers: [GenerarReporteInventarioService],
})
export class ReportesModule {}

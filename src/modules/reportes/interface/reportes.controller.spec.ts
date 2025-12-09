import { Test } from '@nestjs/testing';
import { Response } from 'express';
import { ReportesController } from './reportes.controller';
import { GenerarReporteInventarioService } from '../application/generar-reporte-inventario.service';
import {
  ReporteFormato,
  ReporteScope,
} from './dto/generar-reporte-inventario.dto';
import { PassThrough } from 'stream';

// Creamos un stub de Response de Express para verificar headers y piping del stream.
const makeMockResponse = () => {
  const res: Partial<Response> = {
    set: jest.fn().mockReturnThis(),
  };
  // Simulamos un método para pipear el stream; capturamos el stream recibido.
  const writable = new PassThrough();
  (res as any).pipeTarget = writable;
  res as any as Response;
  (res as any).send = jest.fn();
  (res as any).end = jest.fn();
  (res as any).status = jest.fn().mockReturnThis();
  (res as any).setHeader = jest.fn().mockReturnThis();
  (res as any).attachment = jest.fn().mockReturnThis();
  return res as Response;
};

describe('ReportesController', () => {
  let controller: ReportesController;
  let service: jest.Mocked<GenerarReporteInventarioService>;

  beforeEach(async () => {
    const serviceMock: jest.Mocked<GenerarReporteInventarioService> = {
      ejecutar: jest.fn(),
    } as any;

    const moduleRef = await Test.createTestingModule({
      controllers: [ReportesController],
      providers: [
        { provide: GenerarReporteInventarioService, useValue: serviceMock },
      ],
    }).compile();

    controller = moduleRef.get(ReportesController);
    service = moduleRef.get(GenerarReporteInventarioService);
  });

  it('debe delegar al service y configurar headers para descarga XLSX', async () => {
    // Simulamos un archivo retornado por el servicio.
    const fileStream = new PassThrough();
    fileStream.end('excel-content');
    service.ejecutar.mockResolvedValue({
      stream: fileStream,
      filename: 'inventario_campus_20241209.xlsx',
      mime_type:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const res = makeMockResponse();

    await controller.generarReporte(
      {
        scope: ReporteScope.CAMPUS,
        scopeId: 'campus-1',
        formato: ReporteFormato.XLSX,
      },
      res,
    );

    expect(service.ejecutar).toHaveBeenCalledWith({
      scope: ReporteScope.CAMPUS,
      scopeId: 'campus-1',
      formato: ReporteFormato.XLSX,
    });
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="inventario_campus_20241209.xlsx"',
    );
  });

  it('debe delegar al service y configurar headers para descarga PDF', async () => {
    const fileStream = new PassThrough();
    fileStream.end('pdf-content');
    service.ejecutar.mockResolvedValue({
      stream: fileStream,
      filename: 'inventario_facultad_20241209.pdf',
      mime_type: 'application/pdf',
    });
    const res = makeMockResponse();

    await controller.generarReporte(
      {
        scope: ReporteScope.FACULTAD,
        scopeId: 'fac-1',
        formato: ReporteFormato.PDF,
      },
      res,
    );

    expect(service.ejecutar).toHaveBeenCalledWith({
      scope: ReporteScope.FACULTAD,
      scopeId: 'fac-1',
      formato: ReporteFormato.PDF,
    });
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/pdf',
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="inventario_facultad_20241209.pdf"',
    );
  });
});

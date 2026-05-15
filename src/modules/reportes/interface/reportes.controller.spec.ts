import { Test } from '@nestjs/testing';
import { Response } from 'express';
import { ReportesController } from './reportes.controller';
import { GenerarReporteInventarioService } from '../application/generar-reporte-inventario.service';
import { ReporteFormato, ReporteScope } from './dto/generar-reporte-inventario.dto';
import { PassThrough } from 'stream';

// Stub de Response que implementa writable stream para permitir pipe().
const makeMockResponse = (): Response & PassThrough => {
  const stream = new PassThrough() as Response & PassThrough;
  stream.setHeader = jest.fn().mockReturnValue(stream);
  (stream as any).status = jest.fn().mockReturnValue(stream);
  (stream as any).send = jest.fn().mockReturnValue(stream);
  (stream as any).end = jest.fn().mockReturnValue(stream);
  return stream;
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
        scopeId: 1,
        formato: ReporteFormato.XLSX,
      },
      res,
    );

    expect(service.ejecutar).toHaveBeenCalledWith({
      scope: ReporteScope.CAMPUS,
      scopeId: 1,
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
        scopeId: 1,
        formato: ReporteFormato.PDF,
      },
      res,
    );

    expect(service.ejecutar).toHaveBeenCalledWith({
      scope: ReporteScope.FACULTAD,
      scopeId: 1,
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
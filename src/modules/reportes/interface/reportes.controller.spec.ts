import { Test } from '@nestjs/testing';
import { Response } from 'express';
import { ReportesController } from './reportes.controller';
import { GenerarReporteInventarioService } from '../application/generar-reporte-inventario.service';
import { GenerarReporteAmbienteService } from '../application/generar-reporte-ambiente.service';
import {
  ReporteFormato,
  ReporteScope,
} from './dto/generar-reporte-inventario.dto';
import {
  GenerarReporteAmbienteDto,
  ReporteAmbienteFormato,
} from './dto/generar-reporte-ambiente.dto';
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
  let ambienteService: jest.Mocked<GenerarReporteAmbienteService>;

  beforeEach(async () => {
    const serviceMock: jest.Mocked<GenerarReporteInventarioService> = {
      ejecutar: jest.fn(),
    } as any;
    const ambienteServiceMock: jest.Mocked<GenerarReporteAmbienteService> = {
      ejecutar: jest.fn(),
    } as any;

    const moduleRef = await Test.createTestingModule({
      controllers: [ReportesController],
      providers: [
        { provide: GenerarReporteInventarioService, useValue: serviceMock },
        {
          provide: GenerarReporteAmbienteService,
          useValue: ambienteServiceMock,
        },
      ],
    }).compile();

    controller = moduleRef.get(ReportesController);
    service = moduleRef.get(GenerarReporteInventarioService);
    ambienteService = moduleRef.get(GenerarReporteAmbienteService);
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

  it('debe delegar al service de ambiente y configurar headers para descarga PDF', async () => {
    const fileStream = new PassThrough();
    fileStream.end('pdf-ambiente');
    ambienteService.ejecutar.mockResolvedValue({
      stream: fileStream,
      filename: 'ambiente-FCyT-001.pdf',
      mime_type: 'application/pdf',
    });
    const res = makeMockResponse();

    await controller.generarReporteAmbiente(
      {
        codigo: 'FCyT-001',
        formato: ReporteAmbienteFormato.PDF,
      } as GenerarReporteAmbienteDto,
      res,
    );

    expect(ambienteService.ejecutar).toHaveBeenCalledWith({
      codigo: 'FCyT-001',
      formato: ReporteAmbienteFormato.PDF,
    });
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/pdf',
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="ambiente-FCyT-001.pdf"',
    );
  });
});

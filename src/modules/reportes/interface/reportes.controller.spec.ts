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
  (stream as any).json = jest.fn().mockReturnValue(stream);
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
      obtener_datos_json: jest.fn(),
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

  it('XLSX: delega al service.ejecutar y configura headers para descarga', async () => {
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

  it('PDF: delega al service.obtener_datos_json y devuelve JSON sin KPIs', async () => {
    const datosMock = {
      scope: 'facultad' as const,
      facultad: {
        id: 1,
        codigo: 'F1',
        nombre: 'Fac 1',
        estado: 'activo' as const,
        kpis: { total_ambientes: 10 },
        bloques: [
          {
            id: 2,
            codigo: 'B1',
            nombre: 'Bloque 1',
            tipo_bloque: 'A',
            pisos: 3,
            estado: 'activo' as const,
            kpis: { total_ambientes: 5 },
            ambientes: [
              {
                id: 3,
                codigo: 'A1',
                nombre: 'Amb 1',
                piso: 1,
                tipo_ambiente: 'Aula',
                capacidad: { total: 30, examen: 20 },
                clases: true,
                estado: 'activo' as const,
                activos_count: 5,
              },
            ],
          },
        ],
      },
    };
    service.obtener_datos_json.mockResolvedValue(datosMock);
    const res = makeMockResponse();

    await controller.generarReporte(
      {
        scope: ReporteScope.FACULTAD,
        scopeId: 1,
        formato: ReporteFormato.PDF,
      },
      res,
    );

    expect(service.obtener_datos_json).toHaveBeenCalledWith({
      scope: ReporteScope.FACULTAD,
      scopeId: 1,
      formato: ReporteFormato.PDF,
    });

    // Verificar que se llamó a res.json con datos sin kpis
    const jsonArg = (res.json as jest.Mock).mock.calls[0][0];
    expect(jsonArg).not.toHaveProperty('kpis');
    expect(jsonArg.facultad).not.toHaveProperty('kpis');
    expect(jsonArg.facultad.bloques[0]).not.toHaveProperty('kpis');
    // Pero los datos importantes siguen ahí
    expect(jsonArg.facultad.nombre).toBe('Fac 1');
    expect(jsonArg.facultad.bloques[0].nombre).toBe('Bloque 1');
    expect(jsonArg.facultad.bloques[0].ambientes[0].nombre).toBe('Amb 1');
  });
});

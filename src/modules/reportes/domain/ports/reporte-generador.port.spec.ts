import { ReporteGeneradorPort } from './reporte-generador.port';
import { InventarioReporteViewModel } from '../models/inventario.view-model';
import { PassThrough } from 'stream';

describe('ReporteGeneradorPort (contrato)', () => {
  it('debería exponer generar_xlsx y generar_pdf', () => {
    const port: ReporteGeneradorPort = {
      generar_xlsx: jest.fn(),
      generar_pdf: jest.fn(),
    };
    expect(port.generar_xlsx).toBeDefined();
    expect(port.generar_pdf).toBeDefined();
  });

  it('ejemplo de uso: generar_xlsx recibe view-model y devuelve stream + metadatos', async () => {
    const viewModel: InventarioReporteViewModel = {
      scope: 'campus',
      campus: {
        id: 1,
        codigo: 'C1',
        nombre: 'Campus 1',
        direccion: 'Dir 1',
        estado: 'activo',
        kpis: {},
        facultades: [],
      },
    };

    const stream = new PassThrough();
    stream.end('xlsx-content');

    const port: ReporteGeneradorPort = {
      generar_xlsx: jest.fn().mockResolvedValue({
        stream,
        filename: 'inventario_campus.xlsx',
        mime_type:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
      generar_pdf: jest.fn(),
    };

    const result = await port.generar_xlsx(viewModel);
    expect(result.filename).toContain('inventario_campus');
    expect(result.mime_type).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
  });
});

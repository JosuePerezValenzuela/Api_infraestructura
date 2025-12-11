import { PassThrough } from 'stream';
import { ReporteAmbienteGeneradorAdapter } from './reporte-ambiente-generador.adapter';
import type { AmbienteDetalleViewModel } from '../../domain/ports/ambiente-reporte.repository';

const makeViewModel = (): AmbienteDetalleViewModel => ({
  ambiente: {
    id: 1,
    codigo: 'FCyT-001',
    nombre: 'Aula 1',
    nombre_corto: 'A1',
    piso: 1,
    clases: true,
    activo: true,
    capacidad: { total: 40, examen: 30 },
    dimension: { largo: 5, ancho: 6, alto: 3, unid_med: 'metros' },
    hora_apertura: '08:00',
    hora_cierre: '10:00',
    periodo: 30,
    creado_en: '2024-01-01T00:00:00Z',
    actualizado_en: '2024-01-02T00:00:00Z',
  },
  bloque: {
    id: 10,
    codigo: 'B-10',
    nombre: 'Bloque 10',
    tipo_bloque: { id: 3, nombre: 'Aulas' },
  },
  facultad: { id: 5, codigo: 'F-05', nombre: 'Facultad X', nombre_corto: 'FX' },
  campus: { id: 2, codigo: 'C-02', nombre: 'Campus Central' },
  tipo_ambiente: { id: 7, nombre: 'Aula' },
  horarios: [
    { dia: 0, hora_inicio: '08:00', hora_fin: '09:00' },
    { dia: 1, hora_inicio: '08:30', hora_fin: '10:00' },
  ],
  activos: [{ nia: 'A-001', nombre: 'Proyector', descripcion: null }],
  disponibilidadMatriz: [
    {
      hora: '08:00',
      lunes: true,
      martes: false,
      miercoles: false,
      jueves: false,
      viernes: false,
      sabado: false,
      domingo: false,
    },
  ],
});

const streamToBuffer = (stream: PassThrough): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });

describe('ReporteAmbienteGeneradorAdapter', () => {
  it('genera un PDF con stream y metadatos', async () => {
    const adapter = new ReporteAmbienteGeneradorAdapter();
    const vm = makeViewModel();

    const result = await adapter.generar_pdf(vm);

    expect(result.mime_type).toBe('application/pdf');
    expect(result.filename).toMatch(/ambiente-FCyT-001/);
    const buffer = await streamToBuffer(result.stream as PassThrough);
    expect(buffer.length).toBeGreaterThan(0);
  }, 20000);

  it('genera un Excel con stream y metadatos', async () => {
    const adapter = new ReporteAmbienteGeneradorAdapter();
    const vm = makeViewModel();

    const result = await adapter.generar_excel(vm);

    expect(result.mime_type).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    expect(result.filename).toMatch(/ambiente-FCyT-001/);
    const buffer = await streamToBuffer(result.stream as PassThrough);
    expect(buffer.length).toBeGreaterThan(0);
  });
});

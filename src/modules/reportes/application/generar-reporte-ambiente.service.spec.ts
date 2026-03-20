import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PassThrough } from 'stream';
import { GenerarReporteAmbienteService } from './generar-reporte-ambiente.service';
import { AmbienteReporteRepository } from '../domain/ports/ambiente-reporte.repository';
import { ReporteAmbienteGeneradorPort } from '../domain/ports/ambiente-reporte-generador.port';
import { ReporteAmbienteFormato } from '../interface/dto/generar-reporte-ambiente.dto';

// Helper para crear un stream de salida simulado (contenido no importa para la prueba).
const makeStream = () => {
  const stream = new PassThrough();
  stream.end('contenido');
  return stream;
};

// Helper para un view-model simplificado que incluye horarios para construir la matriz.
const makeViewModel = () => ({
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
    codigo: 'BLO-10',
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
  activos: [{ nia: 'NIA-1', nombre: 'Proyector', descripcion: null }],
  disponibilidadMatriz: [],
});

describe('GenerarReporteAmbienteService', () => {
  let service: GenerarReporteAmbienteService;
  let repo: jest.Mocked<AmbienteReporteRepository>;
  let generador: jest.Mocked<ReporteAmbienteGeneradorPort>;

  beforeEach(async () => {
    const repoMock: jest.Mocked<AmbienteReporteRepository> = {
      obtenerPorId: jest.fn(),
    };
    const generadorMock: jest.Mocked<ReporteAmbienteGeneradorPort> = {
      generar_pdf: jest.fn(),
      generar_excel: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        GenerarReporteAmbienteService,
        { provide: 'AmbienteReporteRepository', useValue: repoMock },
        { provide: 'ReporteAmbienteGeneradorPort', useValue: generadorMock },
      ],
    }).compile();

    service = moduleRef.get<GenerarReporteAmbienteService>(
      GenerarReporteAmbienteService,
    );
    repo = moduleRef.get('AmbienteReporteRepository');
    generador = moduleRef.get('ReporteAmbienteGeneradorPort');
  });

  it('genera PDF y calcula la matriz de disponibilidad', async () => {
    repo.obtenerPorId.mockResolvedValue(makeViewModel());
    generador.generar_pdf.mockResolvedValue({
      stream: makeStream(),
      filename: 'reporte.pdf',
      mime_type: 'application/pdf',
    });

    await service.ejecutar({
      id: 1,
      formato: ReporteAmbienteFormato.PDF,
    });

    expect(repo.obtenerPorId).toHaveBeenCalledWith(1);
    expect(generador.generar_pdf).toHaveBeenCalledTimes(1);
    const vm = generador.generar_pdf.mock.calls[0][0];
    expect(vm.disponibilidadMatriz).toHaveLength(3);
    expect(vm.disponibilidadMatriz[0].lunes).toBe(true);
    expect(vm.disponibilidadMatriz[1].martes).toBe(true);
  });

  it('genera Excel cuando se solicita formato excel', async () => {
    repo.obtenerPorId.mockResolvedValue(makeViewModel());
    generador.generar_excel.mockResolvedValue({
      stream: makeStream(),
      filename: 'reporte.xlsx',
      mime_type:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    await service.ejecutar({
      id: 1,
      formato: ReporteAmbienteFormato.EXCEL,
    });

    expect(generador.generar_excel).toHaveBeenCalledTimes(1);
  });

  it('lanza NotFoundException si el ambiente no existe', async () => {
    repo.obtenerPorId.mockResolvedValue(null);

    await expect(
      service.ejecutar({
        id: 999,
        formato: ReporteAmbienteFormato.PDF,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

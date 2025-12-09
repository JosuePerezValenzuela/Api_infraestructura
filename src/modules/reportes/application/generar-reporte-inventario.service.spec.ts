import { Test } from '@nestjs/testing';
import { PassThrough } from 'stream';
import { GenerarReporteInventarioService } from './generar-reporte-inventario.service';
import { InventarioReporteRepository } from '../domain/ports/inventario-reporte.repository';
import {
  ReporteFormato,
  ReporteScope,
} from '../interface/dto/generar-reporte-inventario.dto';
import { ReporteGeneradorPort } from '../domain/ports/reporte-generador.port';
import { InventarioReporteViewModel } from '../domain/models/inventario.view-model';

// Factory helpers para mocks de view-model y streams.
const makeViewModel = (scope: ReporteScope): InventarioReporteViewModel => {
  if (scope === ReporteScope.CAMPUS) {
    return {
      scope,
      campus: {
        id: 'campus-1',
        codigo: 'C1',
        nombre: 'Campus 1',
        direccion: 'Dir 1',
        estado: 'activo',
        kpis: {},
        facultades: [],
      },
    };
  }
  if (scope === ReporteScope.FACULTAD) {
    return {
      scope,
      facultad: {
        id: 'fac-1',
        codigo: 'F1',
        nombre: 'Fac 1',
        estado: 'activo',
        kpis: {},
        bloques: [],
      },
    };
  }
  return {
    scope,
    bloque: {
      id: 'bloq-1',
      codigo: 'B1',
      nombre: 'Bloque 1',
      tipo_bloque: 'tipo',
      pisos: 1,
      estado: 'activo',
      kpis: {},
      ambientes: [],
    },
  };
};

const makeStream = () => {
  const stream = new PassThrough();
  stream.end('data');
  return stream;
};

describe('GenerarReporteInventarioService', () => {
  let service: GenerarReporteInventarioService;
  let repo: jest.Mocked<InventarioReporteRepository>;
  let generador: jest.Mocked<ReporteGeneradorPort>;

  beforeEach(async () => {
    // Creamos mocks para el repositorio y el generador.
    const repoMock: jest.Mocked<InventarioReporteRepository> = {
      obtener_por_campus: jest.fn(),
      obtener_por_facultad: jest.fn(),
      obtener_por_bloque: jest.fn(),
    };
    const generadorMock: jest.Mocked<ReporteGeneradorPort> = {
      generar_xlsx: jest.fn(),
      generar_pdf: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        GenerarReporteInventarioService,
        { provide: 'InventarioReporteRepository', useValue: repoMock },
        { provide: 'ReporteGeneradorPort', useValue: generadorMock },
      ],
    }).compile();

    service = moduleRef.get(GenerarReporteInventarioService);
    repo = moduleRef.get('InventarioReporteRepository');
    generador = moduleRef.get('ReporteGeneradorPort');
  });

  it('usa repo de campus y generador XLSX cuando scope=campus y formato=xlsx', async () => {
    // Configuramos el repo para devolver un view-model de campus.
    const viewModel = makeViewModel(ReporteScope.CAMPUS);
    repo.obtener_por_campus.mockResolvedValue(viewModel);
    // Configuramos el generador para devolver un archivo simulado.
    generador.generar_xlsx.mockResolvedValue({
      stream: makeStream(),
      filename: 'inventario_campus_20241209.xlsx',
      mime_type:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    await service.ejecutar({
      scope: ReporteScope.CAMPUS,
      scopeId: 'campus-1',
      formato: ReporteFormato.XLSX,
    });

    expect(repo.obtener_por_campus).toHaveBeenCalledWith('campus-1');
    expect(generador.generar_xlsx).toHaveBeenCalledWith(viewModel);
  });

  it('usa repo de facultad y generador PDF cuando scope=facultad y formato=pdf', async () => {
    const viewModel = makeViewModel(ReporteScope.FACULTAD);
    repo.obtener_por_facultad.mockResolvedValue(viewModel);
    generador.generar_pdf.mockResolvedValue({
      stream: makeStream(),
      filename: 'inventario_facultad_20241209.pdf',
      mime_type: 'application/pdf',
    });

    await service.ejecutar({
      scope: ReporteScope.FACULTAD,
      scopeId: 'fac-1',
      formato: ReporteFormato.PDF,
    });

    expect(repo.obtener_por_facultad).toHaveBeenCalledWith('fac-1');
    expect(generador.generar_pdf).toHaveBeenCalledWith(viewModel);
  });

  it('usa repo de bloque y generador PDF cuando scope=bloque y formato=pdf', async () => {
    const viewModel = makeViewModel(ReporteScope.BLOQUE);
    repo.obtener_por_bloque.mockResolvedValue(viewModel);
    generador.generar_pdf.mockResolvedValue({
      stream: makeStream(),
      filename: 'inventario_bloque_20241209.pdf',
      mime_type: 'application/pdf',
    });

    await service.ejecutar({
      scope: ReporteScope.BLOQUE,
      scopeId: 'bloq-1',
      formato: ReporteFormato.PDF,
    });

    expect(repo.obtener_por_bloque).toHaveBeenCalledWith('bloq-1');
    expect(generador.generar_pdf).toHaveBeenCalledWith(viewModel);
  });

  it('arroja si el formato no es soportado', async () => {
    await expect(
      service.ejecutar({
        scope: ReporteScope.CAMPUS,
        scopeId: 'campus-1',
        formato: 'csv' as ReporteFormato,
      }),
    ).rejects.toThrow();
  });
});

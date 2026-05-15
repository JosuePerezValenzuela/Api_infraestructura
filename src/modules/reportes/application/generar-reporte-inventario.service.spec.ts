import { Test } from '@nestjs/testing';
import { PassThrough } from 'stream';
import { NotFoundException } from '@nestjs/common';
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

  // ========== ejecutar (XLSX) ==========

  it('ejecutar: usa repo de campus y generador XLSX cuando scope=campus y formato=xlsx', async () => {
    const viewModel = makeViewModel(ReporteScope.CAMPUS);
    repo.obtener_por_campus.mockResolvedValue(viewModel);
    generador.generar_xlsx.mockResolvedValue({
      stream: makeStream(),
      filename: 'inventario_campus_20241209.xlsx',
      mime_type:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    await service.ejecutar({
      scope: ReporteScope.CAMPUS,
      scopeId: 1,
      formato: ReporteFormato.XLSX,
    });

    expect(repo.obtener_por_campus).toHaveBeenCalledWith(1);
    expect(generador.generar_xlsx).toHaveBeenCalledWith(viewModel);
  });

  it('ejecutar: usa repo de facultad y generador XLSX', async () => {
    const viewModel = makeViewModel(ReporteScope.FACULTAD);
    repo.obtener_por_facultad.mockResolvedValue(viewModel);
    generador.generar_xlsx.mockResolvedValue({
      stream: makeStream(),
      filename: 'inventario_facultad_20241209.xlsx',
      mime_type:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    await service.ejecutar({
      scope: ReporteScope.FACULTAD,
      scopeId: 1,
      formato: ReporteFormato.XLSX,
    });

    expect(repo.obtener_por_facultad).toHaveBeenCalledWith(1);
    expect(generador.generar_xlsx).toHaveBeenCalledWith(viewModel);
  });

  it('ejecutar: lanza NotFoundException si no existe el recurso', async () => {
    repo.obtener_por_campus.mockResolvedValue(null);

    await expect(
      service.ejecutar({
        scope: ReporteScope.CAMPUS,
        scopeId: 999,
        formato: ReporteFormato.XLSX,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  // ========== obtener_datos_json (PDF) ==========

  it('obtener_datos_json: devuelve el view-model para campus', async () => {
    const viewModel = makeViewModel(ReporteScope.CAMPUS);
    repo.obtener_por_campus.mockResolvedValue(viewModel);

    const result = await service.obtener_datos_json({
      scope: ReporteScope.CAMPUS,
      scopeId: 1,
      formato: ReporteFormato.PDF,
    });

    expect(result).toEqual(viewModel);
    expect(repo.obtener_por_campus).toHaveBeenCalledWith(1);
  });

  it('obtener_datos_json: devuelve el view-model para facultad', async () => {
    const viewModel = makeViewModel(ReporteScope.FACULTAD);
    repo.obtener_por_facultad.mockResolvedValue(viewModel);

    const result = await service.obtener_datos_json({
      scope: ReporteScope.FACULTAD,
      scopeId: 1,
      formato: ReporteFormato.PDF,
    });

    expect(result).toEqual(viewModel);
    expect(repo.obtener_por_facultad).toHaveBeenCalledWith(1);
  });

  it('obtener_datos_json: devuelve el view-model para bloque', async () => {
    const viewModel = makeViewModel(ReporteScope.BLOQUE);
    repo.obtener_por_bloque.mockResolvedValue(viewModel);

    const result = await service.obtener_datos_json({
      scope: ReporteScope.BLOQUE,
      scopeId: 1,
      formato: ReporteFormato.PDF,
    });

    expect(result).toEqual(viewModel);
    expect(repo.obtener_por_bloque).toHaveBeenCalledWith(1);
  });

  it('obtener_datos_json: lanza NotFoundException si no existe el recurso', async () => {
    repo.obtener_por_bloque.mockResolvedValue(null);

    await expect(
      service.obtener_datos_json({
        scope: ReporteScope.BLOQUE,
        scopeId: 999,
        formato: ReporteFormato.PDF,
      }),
    ).rejects.toThrow(NotFoundException);
  });
});

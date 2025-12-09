import { Test, TestingModule } from '@nestjs/testing';
import { GenerarReporteInventarioService } from './generar-reporte-inventario.service';

describe('GenerarReporteInventarioService', () => {
  let service: GenerarReporteInventarioService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GenerarReporteInventarioService],
    }).compile();

    service = module.get<GenerarReporteInventarioService>(
      GenerarReporteInventarioService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

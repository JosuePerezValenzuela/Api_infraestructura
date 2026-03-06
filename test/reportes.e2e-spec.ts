import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import {
  ReporteFormato,
  ReporteScope,
} from '../src/modules/reportes/interface/dto/generar-reporte-inventario.dto';

describe('ReportesController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/reportes/inventario-ambientes (GET) deberia devolver 200 y headers para xlsx', async () => {
    // Nota: este test depende de que exista el scopeId en la base; si no hay datos seed, ajusta o mockea.
    const res = await request(app.getHttpServer())
      .get('/reportes/inventario-ambientes')
      .query({
        scope: ReporteScope.FACULTAD,
        scopeId: '1',
        formato: ReporteFormato.XLSX,
      })
      .expect(200);

    expect(res.header['content-type']).toContain(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    expect(res.header['content-disposition']).toContain(
      'attachment; filename=',
    );
    expect(res.body).toBeDefined();
  });

  it('/reportes/inventario-ambientes (GET) deberia devolver 400 con formato invalido', async () => {
    await request(app.getHttpServer())
      .get('/reportes/inventario-ambientes')
      .query({
        scope: ReporteScope.CAMPUS,
        scopeId: '1',
        formato: 'txt',
      })
      .expect(400);
  });
});

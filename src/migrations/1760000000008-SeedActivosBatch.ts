import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedActivosBatch1760000000008 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
        INSERT INTO infraestructura.activos
          (nia, nombre, descripcion, activo, numero_serie, garantia, componentes, tipo_activo_id, ambiente_id)
        VALUES
          (
            'NIA-0001',
            'Proyector Epson X12',
            'Proyector principal del auditorio central',
            TRUE,
            'EPX12-99881',
            '2026-12-31',
            '[{"nombre":"lente","estado":"nuevo"}]'::jsonb,
            (SELECT id FROM infraestructura.tipo_activos WHERE nombre = 'Proyector multimedia'),
            (SELECT id FROM infraestructura.ambientes WHERE codigo = 'AUD-001')
          ),
          (
            'NIA-0002',
            'Router Cisco 2900',
            'Router principal del laboratorio de redes',
            TRUE,
            'CISCO-2900-5544',
            '2027-05-01',
            '[{"nombre":"antena","estado":"nuevo"},{"nombre":"fuente","estado":"usado"}]'::jsonb,
            (SELECT id FROM infraestructura.tipo_activos WHERE nombre = 'Router de red'),
            (SELECT id FROM infraestructura.ambientes WHERE codigo = '55555')
          ),
          (
            'NIA-0003',
            'Computadora Lenovo AIO',
            'Equipo para practicas de software',
            TRUE,
            'LEN-AIO-2025-33',
            '2026-07-15',
            '[{"nombre":"monitor","estado":"nuevo"},{"nombre":"teclado","estado":"nuevo"}]'::jsonb,
            (SELECT id FROM infraestructura.tipo_activos WHERE nombre = 'Equipo de computo'),
            (SELECT id FROM infraestructura.ambientes WHERE codigo = '77777')
          ),
          (
            'NIA-0004',
            'Aire acondicionado Samsung 36k',
            'Equipo de climatizacion del consejo academico',
            TRUE,
            'SAMS-AC36-0001',
            '2028-03-20',
            '[{"nombre":"unidad exterior","estado":"nuevo"},{"nombre":"unidad interior","estado":"nuevo"}]'::jsonb,
            (SELECT id FROM infraestructura.tipo_activos WHERE nombre = 'Aire acondicionado'),
            (SELECT id FROM infraestructura.ambientes WHERE codigo = 'CON-001')
          ),
          (
            'NIA-0005',
            'Juego de pupitres metalicos',
            'Lote de 30 pupitres para aulas',
            TRUE,
            'MOB-PUP-30',
            '2029-01-01',
            '[{"nombre":"pupitres","cantidad":30,"estado":"nuevo"}]'::jsonb,
            (SELECT id FROM infraestructura.tipo_activos WHERE nombre = 'Mobiliario'),
            (SELECT id FROM infraestructura.ambientes WHERE codigo = '69111')
          );
      `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
        DELETE FROM infraestructura.activos
        WHERE nia IN (
          'NIA-0001',
          'NIA-0002',
          'NIA-0003',
          'NIA-0004',
          'NIA-0005'
        );
      `,
    );
  }
}

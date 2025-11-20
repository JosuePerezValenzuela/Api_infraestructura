import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedActivosBatch1760000000008 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
        INSERT INTO infraestructura.activos
          (nia, nombre, descripcion, ambiente_id)
        VALUES
          (
            'NIA-0001',
            'Proyector Epson X12',
            'Proyector principal del auditorio central',
            (SELECT id FROM infraestructura.ambientes WHERE codigo = 'AUD-001')
          ),
          (
            'NIA-0002',
            'Router Cisco 2900',
            'Router principal del laboratorio de redes',
            (SELECT id FROM infraestructura.ambientes WHERE codigo = '55555')
          ),
          (
            'NIA-0003',
            'Computadora Lenovo AIO',
            'Equipo para practicas de software',
            (SELECT id FROM infraestructura.ambientes WHERE codigo = '77777')
          ),
          (
            'NIA-0004',
            'Aire acondicionado Samsung 36k',
            'Equipo de climatizacion del consejo academico',
            (SELECT id FROM infraestructura.ambientes WHERE codigo = 'CON-001')
          ),
          (
            'NIA-0005',
            'Juego de pupitres metalicos',
            'Lote de 30 pupitres para aulas',
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

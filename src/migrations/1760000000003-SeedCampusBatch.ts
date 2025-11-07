import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedCampusBatch1760000000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // TODO: Add raw SQL inserts for campus batch seeding.
    await queryRunner.query(
      `
          INSERT INTO infraestructura.campus (codigo, nombre, direccion, coordenadas)
          VALUES
            ('123456789', 'Campus central', 'Av Sucre entre Belzu y Oquendo', POINT(-66.5, -17.39)),
            ('987654321', 'Valle Sacta', 'Zona sacta', POINT(-63, -18)),
            ('555555555', 'Quillacollo', 'Blanco galindo', POINT(-70, -20)),
            ('222222222', 'Campus Sacaba', 'Av Villazon Km 12, Sacaba', POINT(-65.99, -17.41)),
            ('888888888', 'Campus Tiquipaya', 'Av Ecologica s/n, Tiquipaya', POINT(-65.73, -17.32)),
            ('444444444', 'Campus Cercado Norte', 'Calle Independencia esquina Aroma', POINT(-66.16, -17.37));
        `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
          DELETE FROM infraestructura.campus
          WHERE codigo IN (
            '123456789',
            '987654321',
            '555555555',
            '222222222',
            '888888888',
            '444444444'
          );
        `,
    );
  }
}

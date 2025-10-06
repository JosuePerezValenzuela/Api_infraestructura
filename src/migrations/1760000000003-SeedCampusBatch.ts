import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedCampusBatch1760000000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // TODO: Add raw SQL inserts for campus batch seeding.
    await queryRunner.startTransaction();
    try {
      await queryRunner.query(
        `
          INSERT INTO infraestructura.campus (codigo, nombre, direccion, coordenadas)
          VALUES
            ('123456789', 'Campus central', 'Av Sucre entre Belzu y Oquendo', POINT(-66.5, -17.39)),
            ('987654321', 'Valle Sacta', 'Zona sacta', POINT(-63, -18)),
            ('555555555', 'Quillacollo', 'Blanco galindo', POINT(-70, -20));
        `,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // TODO: Add raw SQL deletes to revert campus batch seeding.
  }
}

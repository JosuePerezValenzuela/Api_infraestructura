import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedFacultadesBatch1760000000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // TODO: Add raw SQL inserts for facultades batch seeding.
    await queryRunner.startTransaction();
    try {
      await queryRunner.query(
        `
          INSERT INTO infraestructura.facultades (codigo, nombre, nombre_corto, coordenadas, campus_id)
          VALUES
            ('12345', 'Facultad de Ciencias y Tecnologia', 'FCyT', POINT(-66.5, -18), 1),
            ('54321', 'Facultad de Ciencias Economicas', 'FCE', POINT(-66, -18), 1),
            ('11225', 'Facultad Villa Sacta', NULL, POINT(-63, -18), 2);
        `,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // TODO: Add raw SQL deletes to revert facultades batch seeding.
  }
}

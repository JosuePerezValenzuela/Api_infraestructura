import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedFacultadesBatch1760000000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // TODO: Add raw SQL inserts for facultades batch seeding.
    await queryRunner.query(
      `
          INSERT INTO infraestructura.facultades (codigo, nombre, nombre_corto, coordenadas, campus_id)
          VALUES
            ('12345', 'Facultad de Ciencias y Tecnologia', 'FCyT', POINT(-66.5, -18), 1),
            ('54321', 'Facultad de Ciencias Economicas', 'FCE', POINT(-66, -18), 1),
            ('11225', 'Facultad Villa Sacta', NULL, POINT(-63, -18), 2),
            ('66789', 'Facultad de Arquitectura y Urbanismo', 'FAU', POINT(-66.52, -17.41), 3),
            ('77889', 'Facultad de Agronomia', 'FA', POINT(-65.98, -17.43), 4),
            ('88990', 'Facultad de Artes y Cultura', 'FAC', POINT(-65.73, -17.30), 5),
            ('99887', 'Facultad de Derecho y Ciencias Politicas', 'FDCP', POINT(-66.15, -17.36), 6);
        `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
          DELETE FROM infraestructura.facultades
          WHERE codigo IN (
            '12345',
            '54321',
            '11225',
            '66789',
            '77889',
            '88990',
            '99887'
          );
        `,
    );
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeleteRestrictions1758700000001 implements MigrationInterface {
  name = 'AddDeleteRestrictions1758700000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // FK en campus_facultades -> campus (RESTRICT: no permite delete si hay relaciones)
    await queryRunner.query(`
      ALTER TABLE infraestructura.campus_facultades
      DROP CONSTRAINT IF EXISTS fk_campus_facultades_campus
    `);
    await queryRunner.query(`
      ALTER TABLE infraestructura.campus_facultades
      ADD CONSTRAINT fk_campus_facultades_campus
      FOREIGN KEY (campus_id) REFERENCES infraestructura.campus(id)
      ON DELETE RESTRICT
    `);

    // FK en campus_facultades -> facultades (RESTRICT)
    await queryRunner.query(`
      ALTER TABLE infraestructura.campus_facultades
      DROP CONSTRAINT IF EXISTS fk_campus_facultades_facultad
    `);
    await queryRunner.query(`
      ALTER TABLE infraestructura.campus_facultades
      ADD CONSTRAINT fk_campus_facultades_facultad
      FOREIGN KEY (facultad_id) REFERENCES infraestructura.facultades(id)
      ON DELETE RESTRICT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restaurar FK sin restricción ON DELETE (vuelve al comportamiento por defecto)
    await queryRunner.query(`
      ALTER TABLE infraestructura.campus_facultades
      DROP CONSTRAINT IF EXISTS fk_campus_facultades_campus
    `);
    await queryRunner.query(`
      ALTER TABLE infraestructura.campus_facultades
      ADD CONSTRAINT fk_campus_facultades_campus
      FOREIGN KEY (campus_id) REFERENCES infraestructura.campus(id)
    `);

    await queryRunner.query(`
      ALTER TABLE infraestructura.campus_facultades
      DROP CONSTRAINT IF EXISTS fk_campus_facultades_facultad
    `);
    await queryRunner.query(`
      ALTER TABLE infraestructura.campus_facultades
      ADD CONSTRAINT fk_campus_facultades_facultad
      FOREIGN KEY (facultad_id) REFERENCES infraestructura.facultades(id)
    `);
  }
}
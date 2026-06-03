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

    // FK en bloques -> campus_facultades (RESTRICT: no permite eliminar relación si hay bloques)
    await queryRunner.query(`
      ALTER TABLE infraestructura.bloques
      DROP CONSTRAINT IF EXISTS fk_bloques_campus_facultad
    `);
    await queryRunner.query(`
      ALTER TABLE infraestructura.bloques
      ADD CONSTRAINT fk_bloques_campus_facultad
      FOREIGN KEY (campus_facultad_id) REFERENCES infraestructura.campus_facultades(id)
      ON DELETE RESTRICT
    `);

    // FK en ambientes -> bloques (RESTRICT: no permite eliminar bloque si hay ambientes)
    await queryRunner.query(`
      ALTER TABLE infraestructura.ambientes
      DROP CONSTRAINT IF EXISTS fk_ambientes_bloque
    `);
    await queryRunner.query(`
      ALTER TABLE infraestructura.ambientes
      ADD CONSTRAINT fk_ambientes_bloque
      FOREIGN KEY (bloque_id) REFERENCES infraestructura.bloques(id)
      ON DELETE RESTRICT
    `);

    // FK en bloques -> tipo_bloques (RESTRICT: no permite eliminar tipo si hay bloques)
    await queryRunner.query(`
      ALTER TABLE infraestructura.bloques
      DROP CONSTRAINT IF EXISTS fk_bloques_tipo_bloque
    `);
    await queryRunner.query(`
      ALTER TABLE infraestructura.bloques
      ADD CONSTRAINT fk_bloques_tipo_bloque
      FOREIGN KEY (tipo_bloque_id) REFERENCES infraestructura.tipo_bloques(id)
      ON DELETE RESTRICT
    `);

    // FK en ambientes -> tipo_ambientes (RESTRICT: no permite eliminar tipo si hay ambientes)
    await queryRunner.query(`
      ALTER TABLE infraestructura.ambientes
      DROP CONSTRAINT IF EXISTS fk_ambientes_tipo_ambiente
    `);
    await queryRunner.query(`
      ALTER TABLE infraestructura.ambientes
      ADD CONSTRAINT fk_ambientes_tipo_ambiente
      FOREIGN KEY (tipo_ambiente_id) REFERENCES infraestructura.tipo_ambientes(id)
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

    await queryRunner.query(`
      ALTER TABLE infraestructura.bloques
      DROP CONSTRAINT IF EXISTS fk_bloques_campus_facultad
    `);
    await queryRunner.query(`
      ALTER TABLE infraestructura.bloques
      ADD CONSTRAINT fk_bloques_campus_facultad
      FOREIGN KEY (campus_facultad_id) REFERENCES infraestructura.campus_facultades(id)
    `);

    await queryRunner.query(`
      ALTER TABLE infraestructura.ambientes
      DROP CONSTRAINT IF EXISTS fk_ambientes_bloque
    `);
    await queryRunner.query(`
      ALTER TABLE infraestructura.ambientes
      ADD CONSTRAINT fk_ambientes_bloque
      FOREIGN KEY (bloque_id) REFERENCES infraestructura.bloques(id)
    `);

    await queryRunner.query(`
      ALTER TABLE infraestructura.bloques
      DROP CONSTRAINT IF EXISTS fk_bloques_tipo_bloque
    `);
    await queryRunner.query(`
      ALTER TABLE infraestructura.bloques
      ADD CONSTRAINT fk_bloques_tipo_bloque
      FOREIGN KEY (tipo_bloque_id) REFERENCES infraestructura.tipo_bloques(id)
    `);

    await queryRunner.query(`
      ALTER TABLE infraestructura.ambientes
      DROP CONSTRAINT IF EXISTS fk_ambientes_tipo_ambiente
    `);
    await queryRunner.query(`
      ALTER TABLE infraestructura.ambientes
      ADD CONSTRAINT fk_ambientes_tipo_ambiente
      FOREIGN KEY (tipo_ambiente_id) REFERENCES infraestructura.tipo_ambientes(id)
    `);
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedBloquesBatch1760000000005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // TODO: Add raw SQL inserts for bloques batch seeding.
    await queryRunner.startTransaction();
    try {
      await queryRunner.query(
        `
          INSERT INTO infraestructura.bloques (nombre, nombre_corto, codigo, pisos, coordenadas, facultad_id, tipo_bloque_id)
          VALUES
            ('Edificio Nuevo de aulas', 'Edifico nuevo', '123456789', 3, (-66,-18), 1, 3),
            ('Edifico de laboratorios', 'Edificio labos', '987654321', 4, (-66,-19), 1, 2),
            ('Pasillo de gallineros', 'Edificio de aulas', '111112222', 1, (-62,-18), 2, 3);
        `,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // TODO: Add raw SQL deletes to revert bloques batch seeding.
  }
}

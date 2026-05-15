import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveFacultadCoordenadas1765000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Eliminar la columna coordenadas de facultades
    await queryRunner.query(`
      ALTER TABLE infraestructura.facultades
      DROP COLUMN IF EXISTS coordenadas;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recrear la columna coordenadas para hacer rollback
    await queryRunner.query(`
      ALTER TABLE infraestructura.facultades
      ADD COLUMN coordenadas point NOT NULL;
    `);
  }
}
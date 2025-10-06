import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedTipoBloquesBatch1760000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // TODO: Add raw SQL inserts for tipo_bloques batch seeding.
    await queryRunner.startTransaction();
    try {
      await queryRunner.query(
        `
          INSERT INTO infraestructura.tipo_bloques (nombre, descripcion)
          VALUES
            ('Administrativo', 'Edificion con oficinas y servicios administrativos'),
            ('Laboratorios', 'Bloques equipados para practicas cientificas y de computacion'),
            ('Deportivo', 'Infraestructura destinada a actividades fisicas');
        `,
      );
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // TODO: Add raw SQL deletes to revert tipo_bloques batch seeding.
  }
}

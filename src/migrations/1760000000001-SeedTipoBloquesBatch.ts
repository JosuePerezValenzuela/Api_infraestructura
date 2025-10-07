import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedTipoBloquesBatch1760000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // TODO: Add raw SQL inserts for tipo_bloques batch seeding.
    await queryRunner.query(
      `
          INSERT INTO infraestructura.tipo_bloques (nombre, descripcion)
          VALUES
            ('Administrativo', 'Edificio con oficinas y servicios administrativos'),
            ('Laboratorios', 'Bloque equipados para practicas cientificas y de computacion'),
            ('Aulas', 'Bloque con aulas para clases convencionales');
        `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // TODO: Add raw SQL deletes to revert tipo_bloques batch seeding.
  }
}

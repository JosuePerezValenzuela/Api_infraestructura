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
            ('Aulas', 'Bloque con aulas para clases convencionales'),
            ('Investigacion', 'Bloque destinado a centros de investigacion y desarrollo tecnologico'),
            ('Servicios estudiantiles', 'Edificios que brindan servicios de bienestar y apoyo al estudiante');
        `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
          DELETE FROM infraestructura.tipo_bloques
          WHERE nombre IN (
            'Administrativo',
            'Laboratorios',
            'Aulas',
            'Investigacion',
            'Servicios estudiantiles'
          );
        `,
    );
  }
}

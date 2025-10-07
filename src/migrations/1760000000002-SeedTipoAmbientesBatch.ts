import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedTipoAmbientesBatch1760000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // TODO: Add raw SQL inserts for tipo_ambientes batch seeding.
    await queryRunner.query(
      `
          INSERT INTO infraestructura.tipo_ambientes (nombre, descripcion, descripcion_corta)
          VALUES
            ('Clases', 'Aula para clases de pizarra', 'Basica'),
            ('Laboratorio de computacion', 'Aula equipada con computadoras personales', 'Laboratorio de computadoras'),
            ('Laboratorio de redes', 'Aula equipada con routers', NULL);
        `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // TODO: Add raw SQL deletes to revert tipo_ambientes batch seeding.
  }
}

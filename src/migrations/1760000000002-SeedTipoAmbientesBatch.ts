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
            ('Laboratorio de redes', 'Aula equipada con routers', NULL),
            ('Auditorio', 'Espacio amplio para conferencias y eventos institucionales', 'Auditorio'),
            ('Sala de reuniones', 'Ambiente destinado a reuniones administrativas o academicas', 'Sala de reuniones');
        `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
          DELETE FROM infraestructura.tipo_ambientes
          WHERE nombre IN (
            'Clases',
            'Laboratorio de computacion',
            'Laboratorio de redes',
            'Auditorio',
            'Sala de reuniones'
          );
        `,
    );
  }
}

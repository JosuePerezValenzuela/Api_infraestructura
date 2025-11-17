import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedTipoActivosBatch1760000000007 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
        INSERT INTO infraestructura.tipo_activos (nombre, descripcion)
        VALUES
          ('Equipo de computo', 'Equipos de escritorio para laboratorios y oficinas'),
          ('Proyector multimedia', 'Dispositivos de proyeccion para aulas y auditorios'),
          ('Router de red', 'Equipamiento de comunicaciones para laboratorios y data centers'),
          ('Aire acondicionado', 'Sistemas de climatizacion instalados en los ambientes'),
          ('Mobiliario', 'Mesas, pupitres y sillas asignados a los ambientes');
      `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
        DELETE FROM infraestructura.tipo_activos
        WHERE nombre IN (
          'Equipo de computo',
          'Proyector multimedia',
          'Router de red',
          'Aire acondicionado',
          'Mobiliario'
        );
      `,
    );
  }
}

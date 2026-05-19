import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitInfraSeedersTipos1758545008737 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
-- =====================================================
-- SEEDERS: CATÁLOGOS DE TIPOS
-- =====================================================

-- Tipo de Bloques
INSERT INTO infraestructura.tipo_bloques (nombre, descripcion)
VALUES
  ('Edif. Aulas', 'Edificio de aulas con pizarra'),
  ('Lab. Computacion', 'Laboratorios de computacion'),
  ('Edif. Administrativo', 'Edificios de servicios administrativos'),
  ('Tall. Carpinteria', 'Talleres de carpinteria'),
  ('Tinglados', 'Ambientes grandes con tinglado'),
  ('Departamento', 'Departamentos'),
  ('Edif. Mixto', 'Edificio que ofrece distintos servicios y/o distintos tipos de aulas'),
  ('Anfiteatro', 'Anfiteatros'),
  ('Comedor', 'Comedores'),
  ('Tall. Forestales', 'Talleres Forestales'),
  ('Edif. Cientifico', 'Edificio de investigacion/produccion cientifica'),
  ('Aula Magna', 'Aulas Magna'),
  ('Sala Audiovisual', 'Salas Audiovisuales'),
  ('Lab. Basicos', 'Laboratorios basicos'),
  ('Otro', 'Otros'),
  ('Aprisco', 'Apriscos'),
  ('Lab. Suelos', 'Laboratorios de suelos');

-- Tipo de Ambientes
INSERT INTO infraestructura.tipo_ambientes (nombre, descripcion, descripcion_corta)
VALUES
  ('Aula', 'Aula de clases', NULL),
  ('Salon Auditorio', 'Salon de auditorio', 'Clases normales'),
  ('Laboratorio', 'Aula tipo laboratorio', NULL),
  ('Anfiteatro', 'Anfiteatro', NULL),
  ('Comunidad', 'Comunidad', NULL),
  ('Taller', 'Aula tipo taller', NULL),
  ('Oficina', 'Ambiente tipo oficina', NULL),
  ('Otro', 'Otros', NULL),
  ('Biblioteca', 'Biblioteca', NULL),
  ('Establo', 'Establo', NULL),
  ('Clinica', 'Clinicas', 'Otro'),
  ('Quirofano', 'Quirofanos', NULL);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
DELETE FROM infraestructura.tipo_ambientes;
DELETE FROM infraestructura.tipo_bloques;
    `);
  }
}

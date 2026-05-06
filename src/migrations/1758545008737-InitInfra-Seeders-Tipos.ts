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
  ('Aulas', 'Bloque con aulas para clases convencionales'),
  ('Laboratorios de computacion', 'Bloque equipados para practicas de computacion'),
  ('Servicios estudiantiles', 'Edificios que brindando servicios de bienestar y apoyo al estudiante'),
  ('Canchas de Futbol 5', 'Canchas de cemento'),
  ('Laboratorios basicos', 'Ambiente que tiene laboratorios basicos de FCyT'),
  ('Talleres de carpinteria', 'Aula para carpinteria'),
  ('Administracion', 'Edificio administrativo'),
  ('Talleres', 'Edificio de talleres'),
  ('Laboratorio de suelos', 'Laboratorio suelos'),
  ('Laboratorios de hidraulica', 'Laboratorio de hidraulica'),
  ('Departamento', 'Departamento de carrera'),
  ('Anfiteatro', 'Anfiteatro'),
  ('Comedor', 'Comedor'),
  ('Aula Magna', 'Aula Magna'),
  ('Salas audiovisuales', 'Salas audiovisuales');

-- Tipo de Ambientes
INSERT INTO infraestructura.tipo_ambientes (nombre, descripcion, descripcion_corta)
VALUES
  ('Oficina', 'Ambiente de tipo oficina', NULL),
  ('Aula', 'Ambiente para clases normales', 'Clases normales'),
  ('Salon auditorium', 'Ambiente de tipo auditorium', NULL),
  ('Laboratorio', 'Laboratorio comun', NULL),
  ('Taller', 'Taller', NULL),
  ('Biblioteca', 'Ambiente para solicitar libros', NULL),
  ('Anfiteatro', 'Anfiteatro', NULL),
  ('Quirofano', 'Ambiente de practicas', NULL),
  ('Clinica', 'Ambiente para practicas', NULL),
  ('Otro', 'Otro', 'Otro'),
  ('Establo', 'Ambiente grande', NULL);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
DELETE FROM infraestructura.tipo_ambientes;
DELETE FROM infraestructura.tipo_bloques;
    `);
  }
}

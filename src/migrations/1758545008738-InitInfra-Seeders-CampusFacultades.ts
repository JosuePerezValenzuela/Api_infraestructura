import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitInfraSeedersCampusFacultades1758545008738 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
-- =====================================================
-- SEEDERS: CAMPUS, FACULTADES Y RELACIONES
-- =====================================================

-- Campus
INSERT INTO infraestructura.campus (codigo, nombre, direccion, coordenadas)
VALUES
  ('1', 'LAS CUADRAS', 'Av. Sucre entre Oquendo y Belzu', POINT(-17.393498, -66.145992)),
  ('2', 'SALUD', 'Av. Aniceto arce entre Oquendo y Venezuela', POINT(-17.387393, -66.149539)),
  ('3', 'TAMBORADA', 'Av. Petrolera km 5, Zona la Tamborada', POINT(-17.450072, -66.133656)),
  ('4', 'QUILLACOLLO NORTE', 'Predios de la Ex casa Hoschield, Tacata norte', POINT(-17.380368, -66.289096)),
  ('5', 'TEMPORAL', 'Av. Atahuallpa final, barrio prefectual', POINT(-17.350790, -66.155407)),
  ('6', 'PUNATA', 'Valle alto', POINT(-17.542904, -65.843325)),
  ('7', 'POLIFUNCIONAL', 'Av. Jordan entre Ayacucho y Nataniel Aguirre', POINT(-17.395464, -66.157559)),
  ('8', '25 MAYO (TVU)', 'Av. 25 de Mayo Num. 145', POINT(-17.391347, -66.155819)),
  ('9', 'POSTGRADO FCE', 'C. La Paz entre 16 de Julio y Cristo Carrillo', POINT(-17.383051, -66.154024)),
  ('10', 'CS. SOCIALES', 'Bernardo Monteagudo entre Hermogenes Sejas y Zenon Salinas', POINT(-17.383051, -66.154024)),
  ('11', 'QUILLACOLLO', 'Av. Blanco Galindo', POINT(-17.394075, -66.288277)),
  ('12', 'SACABA', 'U.E. Carlos Peredo', POINT(-17.393443, -66.058949));

-- Facultades (sin campus_id, ahora se Relacionan via campus_facultades)
INSERT INTO infraestructura.facultades (codigo, nombre, nombre_corto)
VALUES
  ('20', 'CIENCIAS Y TECNOLOGIA', 'FCyT'),
  ('13', 'CIENCIAS ECONOMICAS', 'FCE'),
  ('18', 'HUMANIDADES Y CS. DE LA EDUCACION', 'FHCE'),
  ('19', 'CIENCIAS JURIDICAS Y POLITICAS', 'FCJyP'),
  ('17', 'ARQUITECTURA Y CIENCIAS DEL HABITAT', 'FACH'),
  ('23', 'CIENCIAS SOCIALES', 'SOC'),

  ('16', 'MEDICINA', 'MED'),
  ('12', 'CS. FARMACEUTICAS Y BIOQUIMICAS', 'BQM'),

  ('14', 'DESARROLLO RURAL Y TERRITORIAL', 'ETSA'),

  ('27', 'CIENCIAS VETERINARIAS', 'FCV'),

  ('21', 'POLITECNICA DEL VALLE ALTO', 'IPU'),

  ('29', 'ENFERMERIA', 'ENF'),

  ('15', 'ODONTOLOGIA', 'ODT'),

  ('10', 'CIENCIAS AGRICOLAS Y PECUARIAS', 'FCAPyF');

-- Campus_Facultades (relaciones M:M)
-- Las facultades que antes tenian campus_id ahora se mapean aqui
INSERT INTO infraestructura.campus_facultades (campus_id, facultad_id)
VALUES
  -- Campus 1: Las cuadras
  (1, 1),  -- CIENCIAS Y TECNOLOGIA
  (1, 2),  -- CIENCIAS ECONOMICAS
  (1, 3),  -- HUMANIDADES Y CS. DE LA EDUCACION
  (1, 4),  -- CIENCIAS JURIDICAS Y POLITICAS
  (1, 5),  -- ARQUITECTURA Y CIENCIAS DEL HABITAT
  (1, 6),  -- CIENCIAS SOCIALES

  -- Campus 2: Salud
  (2, 7),  -- MEDICINA
  (2, 8),  -- CS. FARMACEUTICAS Y BIOQUIMICAS
  (2, 13),  -- ODONTOLOGIA

  -- Campus 3: Tamborada
  (3, 14),  -- CIENCIAS AGRICOLAS Y PECUARIAS
  (3, 9), -- DESARROLLO RURAL Y TERRITORIAL

  -- Campus 4: Quillacollo Norte
  (4, 10),  -- CIENCIAS VETERINARIAS

  -- Campus 5: Temporal
  (5, 14),  -- CIENCIAS AGRICOLAS Y PECUARIAS

  -- Campus 6: Punata
  (6, 11), -- POLITECNICA DEL VALLE ALTO

  -- Campus 7: Polifuncional
  (7, 12), -- ENFERMERIA

  -- Campus 8: TVU
  (8, 13), -- ODONTOLOGIA

  -- Campus 3: Tamborada
  (3, 1),  -- CIENCIAS Y TECNOLOGIA

  -- Campus 9: POSTGRADO FCE
  (9, 2), -- ENFERMERIA

  -- Campus 10: SOCIALES
  (10, 6), -- SOCIALES

  -- Campus 11: QUILLACOLLO
  (11, 1), -- CIENCIAS Y TECNOLOGIA

  -- Campus 12: SACABA
  (12, 4); -- JURIDICAS
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
DELETE FROM infraestructura.campus_facultades;
DELETE FROM infraestructura.facultades;
DELETE FROM infraestructura.campus;
    `);
  }
}

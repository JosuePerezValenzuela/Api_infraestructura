import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitInfraSeedersBloques1758545008739 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
-- =====================================================
-- SEEDERS: BLOQUES
-- Separados por facultad/campus para mejor lectura
-- =====================================================

-- -----------------------------------------------------
-- Campus 1: Las cuadras
-- -----------------------------------------------------

-- Facultad 1: CIENCIAS Y TECNOLOGIA (campus_facultad_id = 1)
INSERT INTO infraestructura.bloques (codigo, nombre, nombre_corto, pisos, coordenadas, campus_facultad_id, tipo_bloque_id)
VALUES
  ('12', 'Dept. Informatica', NULL, 0, POINT(-17.392893305976845, -66.14698284354343), 1, 11),
  ('14', 'Bloque talleres de carpinteria', NULL, 0, POINT(-17.393297, -66.144679), 1, 6),
  ('15', 'Bloque trencito', 'Trencito', 0, POINT(-17.394194877946198, -66.14637952178525), 1, 1),
  ('24', 'Administracion central FCyT', NULL, 4, POINT(-17.393283366843665, -66.14505660420261), 1, 7),
  ('25', 'Edif. Matematicas', NULL, 4, POINT(-17.394647335785333, -66.1444047991186), 1, 1),
  ('26', 'Edif "ELEKTRO"', 'Elektro', 4, POINT(-17.39375657120783, -66.14539050311713), 1, 1),
  ('27', 'Bloque "Tinglados"', 'Tinglados', 0, POINT(-17.393322460735654, -66.1441282908238), 1, 4),
  ('28', 'Dept. "Biologia"', 'Biologia', 1, POINT(-17.39392953370139, -66.14488124427196), 1, 11),
  ('30', 'Dept. "Fisica"', 'Fisica', 1, POINT(-17.392896089257317, -66.14486417479812), 1, 11),
  ('33', 'Dept. "Quimica"', 'Quimica', 1, POINT(-17.393445301077982, -66.14434121341917), 1, 11),
  ('45', 'Bloque "MEMI"', 'MEMI', 1, POINT(-17.393122204064174, -66.14695871966515), 1, 3),
  ('46', 'Bloque "Alimentos y Aguas"', NULL, 2, POINT(-17.392534688141776, -66.14451730092618), 1, 3),
  ('47', 'Dept. "Industrial"', 'Industrial', 2, POINT(-17.39327003536347, -66.14583003557222), 1, 11),
  ('186', 'Edif. nuevo tecnologia', NULL, 4, POINT(-17.394814223471016, -66.14478032314958), 1, 1),
  ('191', 'Edif. academico 2 FCyT', NULL, 4, POINT(-17.39480906056829, -66.14475659284886), 1, 1),
  ('201', 'Edif. de laboratorios FCyT', NULL, 4, POINT(-17.394631693089266, -66.14440572033578), 1, 5);

-- Facultad 2: CIENCIAS ECONOMICAS (campus_facultad_id = 2)
INSERT INTO infraestructura.bloques (codigo, nombre, nombre_corto, pisos, coordenadas, campus_facultad_id, tipo_bloque_id)
VALUES
  ('6', 'Edif. antiguo FCE', NULL, 2, POINT(-17.395188, -66.147507), 2, 1),
  ('7', 'Edif. nuevo FCE', NULL, 4, POINT(-17.39475818432094, -66.14844692877003), 2, 1),
  ('151', 'Edif. prototipo economia', NULL, 4, POINT(-17.394785592989894, -66.14800097320725), 2, 1),
  ('187', 'Edif. prototipo economia III', NULL, 2, POINT(-17.394865466858317, -66.14797534421115), 2, 1),
  ('197', 'Edif. academico economia', NULL, 4, POINT(-17.394377, -66.148609), 2, 1);

-- Facultad 3: HUMANIDADES Y CS. DE LA EDUCACION (campus_facultad_id = 3)
INSERT INTO infraestructura.bloques (codigo, nombre, nombre_corto, pisos, coordenadas, campus_facultad_id, tipo_bloque_id)
VALUES
  ('9', 'Edif. Humanidades', NULL, 4, POINT(-17.392989, -66.147479), 3, 1),
  ('10', 'Humanidades - Aulas 1', NULL, 2, POINT(-17.392989, -66.147479), 3, 1),
  ('11', 'Humanidades - Aulas 2', NULL, 2, POINT(-17.392989, -66.147479), 3, 1),
  ('49', 'Edif. academico multiple', NULL, 3, POINT(-17.39394746268235, -66.14743092384471), 3, 1),
  ('184', 'Edif. nuevo humanidades', NULL, 3, POINT(-17.392901250750487, -66.14798687050717), 3, 1),
  ('195', 'Edif. nuevo humanidades 2', NULL, 3, POINT(-17.392924136236232, -66.14761521846093), 3, 1);

-- Facultad 4: CIENCIAS JURIDICAS Y POLITICAS (campus_facultad_id = 4)
INSERT INTO infraestructura.bloques (codigo, nombre, nombre_corto, pisos, coordenadas, campus_facultad_id, tipo_bloque_id)
VALUES
  ('1', 'Edif. Cs. Politica', NULL, 5, POINT(-17.392953603912115, -66.1484495907248), 4, 1),
  ('176', 'Edif. nuevo derecho', NULL, 3, POINT(-17.393277600534798, -66.14875488236139), 4, 1);

-- Facultad 5: ARQUITECTURA Y CIENCIAS DEL HABITAT (campus_facultad_id = 5)
INSERT INTO infraestructura.bloques (codigo, nombre, nombre_corto, pisos, coordenadas, campus_facultad_id, tipo_bloque_id)
VALUES
  ('171', 'Bloque principal arquitectura', 'Arquitectura', 4, POINT(-17.394775373974912, -66.14666193724489), 5, 11),
  ('172', 'Arquitectura aulas nuevas', NULL, 4, POINT(-17.394775373974912, -66.14666193724489), 5, 1),
  ('173', 'Salas audiovisuales arquitectura', NULL, 0, POINT(-17.395112799351832, -66.14633002231992), 5, 15),
  ('174', 'Gallineros arquitectura', NULL, 0, POINT(-17.39495061865345, -66.14668942263657), 5, 1);

-- Facultad 6: CIENCIAS SOCIALES (campus_facultad_id = 6)
-- (sin bloques en el seed original para esta facultad)

-- -----------------------------------------------------
-- Campus 2: Salud
-- -----------------------------------------------------

-- Facultad 7: MEDICINA (campus_facultad_id = 7)
INSERT INTO infraestructura.bloques (codigo, nombre, nombre_corto, pisos, coordenadas, campus_facultad_id, tipo_bloque_id)
VALUES
  ('58', 'Edif. Medicina', 'Medicina', 4, POINT(-17.3873304176794, -66.1491962258632), 7, 11),
  ('62', 'Anfiteatro Medicina', NULL, 0, POINT(-17.3871469312673, -66.14972372239875), 7, 12),
  ('185', 'Edif. nuevo medicina', NULL, 3, POINT(-17.387341, -66.149521), 7, 1);

-- Facultad 8: ODONTOLOGIA (campus_facultad_id = 8)
INSERT INTO infraestructura.bloques (codigo, nombre, nombre_corto, pisos, coordenadas, campus_facultad_id, tipo_bloque_id)
VALUES
  ('63', 'Edif. central Odontologia', 'Odontologia', 4, POINT(-17.386712832670096, -66.1498504455973), 8, 11),
  ('64', 'Anfiteatro Odontologia', NULL, 0, POINT(-17.386712832670096, -66.1498504455973), 8, 12),
  ('196', 'Edif. nuevo odontologia', NULL, 3, POINT(-17.38689079456353, -66.14968954790615), 8, 1);

-- Facultad 9: CS. FARMACEUTICAS Y BIOQUIMICAS (campus_facultad_id = 9)
INSERT INTO infraestructura.bloques (codigo, nombre, nombre_corto, pisos, coordenadas, campus_facultad_id, tipo_bloque_id)
VALUES
  ('65', 'Edf. central Bioquimica', 'Bioquimica', 4, POINT(-17.387143638747148, -66.14925961084457), 9, 11);

-- -----------------------------------------------------
-- Campus 3: Tamborada
-- -----------------------------------------------------

-- Facultad 10: CIENCIAS AGRICOLAS Y PECUARIAS (campus_facultad_id = 10)
INSERT INTO infraestructura.bloques (codigo, nombre, nombre_corto, pisos, coordenadas, campus_facultad_id, tipo_bloque_id)
VALUES
  ('37', 'Bloque antiguo agroquimica', NULL, 2, POINT(-17.451150, -66.132847), 10, 1),
  ('38', 'Bloque nuevo agroquimica', NULL, 4, POINT(-17.451150, -66.132847), 10, 1),
  ('74', 'Edif. central Agronomia', 'Agronomia', 4, POINT(-17.449265082015717, -66.13490045072257), 10, 11),
  ('99', 'Laboratorio de suelos', NULL, 0, POINT(-17.45075927181928, -66.13363444908978), 10, 9);

-- Facultad 11: DESARROLLO RURAL Y TERRITORIAL (campus_facultad_id = 11)
INSERT INTO infraestructura.bloques (codigo, nombre, nombre_corto, pisos, coordenadas, campus_facultad_id, tipo_bloque_id)
VALUES
  ('110', 'Bloque A ETSA', 'ETSA', 2, POINT(-17.4516473604238, -66.13323199496305), 11, 11),
  ('111', 'Aulas ETSA', NULL, 2, POINT(-17.4516473604238, -66.13323199496305), 11, 1),
  ('115', 'Aula Magna ETSA', NULL, 0, POINT(-17.451794, -66.132992), 11, 14),
  ('116', 'Talleres ETSA', NULL, 0, POINT(-17.451794, -66.132992), 11, 8);

-- -----------------------------------------------------
-- Campus 4: Quillacollo
-- -----------------------------------------------------

-- Facultad 12: CIENCIAS VETERINARIAS (campus_facultad_id = 12)
INSERT INTO infraestructura.bloques (codigo, nombre, nombre_corto, pisos, coordenadas, campus_facultad_id, tipo_bloque_id)
VALUES
  ('124', 'Edif. Veterinaria', 'Veterinaria', 3, POINT(-17.38034790386709, -66.28913317573738), 12, 11);

-- -----------------------------------------------------
-- Campus 5: Temporal
-- -----------------------------------------------------

-- Facultad 10: CIENCIAS AGRICOLAS Y PECUARIAS (campus_facultad_id = 13) -- Misma facultad en diferente campus!
INSERT INTO infraestructura.bloques (codigo, nombre, nombre_corto, pisos, coordenadas, campus_facultad_id, tipo_bloque_id)
VALUES
  ('67', 'Edif. central ESFOR', 'ESFOR', 0, POINT(-17.35066319971384, -66.15533868425078), 13, 11),
  ('70', 'Comedor ESFOR', NULL, 0, POINT(-17.350385, -66.154957), 13, 13),
  ('71', 'Talleres ESFOR', NULL, 0, POINT(-17.350267, -66.155101), 13, 8);

-- -----------------------------------------------------
-- Campus 6: Punata
-- -----------------------------------------------------

-- Facultad 13: POLITECNICA DEL VALLE ALTO (campus_facultad_id = 14)
-- (sin bloques en el seed original para esta facultad)

-- -----------------------------------------------------
-- Campus 7: Polifuncional
-- -----------------------------------------------------

-- Facultad 14: ENFERMERIA (campus_facultad_id = 15)
-- (sin bloques en el seed original para esta facultad)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
DELETE FROM infraestructura.bloques;
    `);
  }
}

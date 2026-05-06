import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitInfraSeedersAmbientes1758545008740 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
-- =====================================================
-- SEEDERS: AMBIENTES
-- Separados por bloque para mejor lectura
-- =====================================================

-- -----------------------------------------------------
-- Campus 1: Las cuadras - FCyT (campus_facultad_id = 1)
-- -----------------------------------------------------

-- Bloque 12: Dept. Informatica (tipo_bloque_id = 11)
INSERT INTO infraestructura.ambientes (nombre, nombre_corto, codigo, piso, capacidad, dimension, clases, tipo_ambiente_id, bloque_id)
VALUES
  ('LABORATORIO 1', 'LAB1', 'LAB-INFO-1', 0, '{"total": 30, "examen": 15}'::jsonb, '{"largo": 8, "ancho": 6, "alto": 3, "unid_med": "metros"}'::jsonb, TRUE, 4, (SELECT id FROM infraestructura.bloques WHERE codigo = '12')),
  ('LABORATORIO 2', 'LAB2', 'LAB-INFO-2', 0, '{"total": 30, "examen": 15}'::jsonb, '{"largo": 8, "ancho": 6, "alto": 3, "unid_med": "metros"}'::jsonb, TRUE, 4, (SELECT id FROM infraestructura.bloques WHERE codigo = '12')),
  ('AULA 101', 'A101', 'AULA-INFO-101', 1, '{"total": 40, "examen": 20}'::jsonb, '{"largo": 10, "ancho": 8, "alto": 3, "unid_med": "metros"}'::jsonb, TRUE, 2, (SELECT id FROM infraestructura.bloques WHERE codigo = '12'));

-- Bloque 15: Bloque trencito (tipo_bloque_id = 1)
INSERT INTO infraestructura.ambientes (nombre, nombre_corto, codigo, piso, capacidad, dimension, clases, tipo_ambiente_id, bloque_id)
VALUES
  ('AULA 1', 'A1', 'TRENCITO-A1', 0, '{"total": 50, "examen": 25}'::jsonb, '{"largo": 12, "ancho": 8, "alto": 3, "unid_med": "metros"}'::jsonb, TRUE, 2, (SELECT id FROM infraestructura.bloques WHERE codigo = '15')),
  ('AULA 2', 'A2', 'TRENCITO-A2', 0, '{"total": 50, "examen": 25}'::jsonb, '{"largo": 12, "ancho": 8, "alto": 3, "unid_med": "metros"}'::jsonb, TRUE, 2, (SELECT id FROM infraestructura.bloques WHERE codigo = '15'));

-- Bloque 24: Administracion central FCyT (tipo_bloque_id = 7)
INSERT INTO infraestructura.ambientes (nombre, nombre_corto, codigo, piso, capacidad, dimension, clases, tipo_ambiente_id, bloque_id)
VALUES
  ('OFICINA 1', 'OF1', 'ADMIN-OF1', 1, '{"total": 5, "examen": 0}'::jsonb, '{"largo": 4, "ancho": 3, "alto": 2.5, "unid_med": "metros"}'::jsonb, FALSE, 1, (SELECT id FROM infraestructura.bloques WHERE codigo = '24')),
  ('OFICINA 2', 'OF2', 'ADMIN-OF2', 2, '{"total": 5, "examen": 0}'::jsonb, '{"largo": 4, "ancho": 3, "alto": 2.5, "unid_med": "metros"}'::jsonb, FALSE, 1, (SELECT id FROM infraestructura.bloques WHERE codigo = '24')),
  ('SECRETARIA', 'SEC', 'ADMIN-SEC', 1, '{"total": 3, "examen": 0}'::jsonb, '{"largo": 3, "ancho": 2, "alto": 2.5, "unid_med": "metros"}'::jsonb, FALSE, 1, (SELECT id FROM infraestructura.bloques WHERE codigo = '24'));

-- Bloque 25: Edif. Matematicas (tipo_bloque_id = 1)
INSERT INTO infraestructura.ambientes (nombre, nombre_corto, codigo, piso, capacidad, dimension, clases, tipo_ambiente_id, bloque_id)
VALUES
  ('AULA 201', 'A201', 'MAT-A201', 2, '{"total": 60, "examen": 30}'::jsonb, '{"largo": 10, "ancho": 8, "alto": 3, "unid_med": "metros"}'::jsonb, TRUE, 2, (SELECT id FROM infraestructura.bloques WHERE codigo = '25')),
  ('AULA 202', 'A202', 'MAT-A202', 2, '{"total": 60, "examen": 30}'::jsonb, '{"largo": 10, "ancho": 8, "alto": 3, "unid_med": "metros"}'::jsonb, TRUE, 2, (SELECT id FROM infraestructura.bloques WHERE codigo = '25')),
  ('AULA 301', 'A301', 'MAT-A301', 3, '{"total": 60, "examen": 30}'::jsonb, '{"largo": 10, "ancho": 8, "alto": 3, "unid_med": "metros"}'::jsonb, TRUE, 2, (SELECT id FROM infraestructura.bloques WHERE codigo = '25')),
  ('AULA 302', 'A302', 'MAT-A302', 3, '{"total": 60, "examen": 30}'::jsonb, '{"largo": 10, "ancho": 8, "alto": 3, "unid_med": "metros"}'::jsonb, TRUE, 2, (SELECT id FROM infraestructura.bloques WHERE codigo = '25'));

-- Bloque 26: Edif "ELEKTRO" (tipo_bloque_id = 1)
INSERT INTO infraestructura.ambientes (nombre, nombre_corto, codigo, piso, capacidad, dimension, clases, tipo_ambiente_id, bloque_id)
VALUES
  ('AULA 101', 'A101', 'ELEKTRO-A101', 1, '{"total": 45, "examen": 22}'::jsonb, '{"largo": 9, "ancho": 7, "alto": 3, "unid_med": "metros"}'::jsonb, TRUE, 2, (SELECT id FROM infraestructura.bloques WHERE codigo = '26')),
  ('AULA 102', 'A102', 'ELEKTRO-A102', 1, '{"total": 45, "examen": 22}'::jsonb, '{"largo": 9, "ancho": 7, "alto": 3, "unid_med": "metros"}'::jsonb, TRUE, 2, (SELECT id FROM infraestructura.bloques WHERE codigo = '26')),
  ('LABORATORIO ELECTRONICA', 'LAB-EL', 'ELEKTRO-LAB1', 2, '{"total": 25, "examen": 12}'::jsonb, '{"largo": 7, "ancho": 5, "alto": 3, "unid_med": "metros"}'::jsonb, TRUE, 4, (SELECT id FROM infraestructura.bloques WHERE codigo = '26'));

-- Bloque 30: Dept. "Fisica" (tipo_bloque_id = 11)
INSERT INTO infraestructura.ambientes (nombre, nombre_corto, codigo, piso, capacidad, dimension, clases, tipo_ambiente_id, bloque_id)
VALUES
  ('LABORATORIO FISICA 1', 'LAB-F1', 'FISICA-LAB1', 0, '{"total": 20, "examen": 10}'::jsonb, '{"largo": 6, "ancho": 5, "alto": 3, "unid_med": "metros"}'::jsonb, TRUE, 4, (SELECT id FROM infraestructura.bloques WHERE codigo = '30')),
  ('LABORATORIO FISICA 2', 'LAB-F2', 'FISICA-LAB2', 0, '{"total": 20, "examen": 10}'::jsonb, '{"largo": 6, "ancho": 5, "alto": 3, "unid_med": "metros"}'::jsonb, TRUE, 4, (SELECT id FROM infraestructura.bloques WHERE codigo = '30')),
  ('AULA FISICA', 'AFIS', 'FISICA-A1', 1, '{"total": 40, "examen": 20}'::jsonb, '{"largo": 8, "ancho": 7, "alto": 3, "unid_med": "metros"}'::jsonb, TRUE, 2, (SELECT id FROM infraestructura.bloques WHERE codigo = '30'));

-- Bloque 33: Dept. "Quimica" (tipo_bloque_id = 11)
INSERT INTO infraestructura.ambientes (nombre, nombre_corto, codigo, piso, capacidad, dimension, clases, tipo_ambiente_id, bloque_id)
VALUES
  ('LABORATORIO QUIMICA 1', 'LAB-Q1', 'QUIMICA-LAB1', 0, '{"total": 25, "examen": 12}'::jsonb, '{"largo": 7, "ancho": 5, "alto": 3, "unid_med": "metros"}'::jsonb, TRUE, 4, (SELECT id FROM infraestructura.bloques WHERE codigo = '33')),
  ('LABORATORIO QUIMICA 2', 'LAB-Q2', 'QUIMICA-LAB2', 0, '{"total": 25, "examen": 12}'::jsonb, '{"largo": 7, "ancho": 5, "alto": 3, "unid_med": "metros"}'::jsonb, TRUE, 4, (SELECT id FROM infraestructura.bloques WHERE codigo = '33')),
  ('AULA QUIMICA', 'AQ', 'QUIMICA-A1', 1, '{"total": 50, "examen": 25}'::jsonb, '{"largo": 10, "ancho": 8, "alto": 3, "unid_med": "metros"}'::jsonb, TRUE, 2, (SELECT id FROM infraestructura.bloques WHERE codigo = '33'));

-- Bloque 45: Bloque "MEMI" (tipo_bloque_id = 3)
INSERT INTO infraestructura.ambientes (nombre, nombre_corto, codigo, piso, capacidad, dimension, clases, tipo_ambiente_id, bloque_id)
VALUES
  ('SALON MULTIUSO', 'SMU', 'MEMI-SALON', 0, '{"total": 100, "examen": 50}'::jsonb, '{"largo": 15, "ancho": 10, "alto": 4, "unid_med": "metros"}'::jsonb, TRUE, 3, (SELECT id FROM infraestructura.bloques WHERE codigo = '45'));

-- Bloque 201: Edif. de laboratorios FCyT (tipo_bloque_id = 5)
INSERT INTO infraestructura.ambientes (nombre, nombre_corto, codigo, piso, capacidad, dimension, clases, tipo_ambiente_id, bloque_id)
VALUES
  ('LABORATORIO CENTRAL 1', 'LC1', 'LAB-CENT-1', 1, '{"total": 40, "examen": 20}'::jsonb, '{"largo": 10, "ancho": 8, "alto": 3, "unid_med": "metros"}'::jsonb, TRUE, 4, (SELECT id FROM infraestructura.bloques WHERE codigo = '201')),
  ('LABORATORIO CENTRAL 2', 'LC2', 'LAB-CENT-2', 1, '{"total": 40, "examen": 20}'::jsonb, '{"largo": 10, "ancho": 8, "alto": 3, "unid_med": "metros"}'::jsonb, TRUE, 4, (SELECT id FROM infraestructura.bloques WHERE codigo = '201')),
  ('LABORATORIO CENTRAL 3', 'LC3', 'LAB-CENT-3', 2, '{"total": 40, "examen": 20}'::jsonb, '{"largo": 10, "ancho": 8, "alto": 3, "unid_med": "metros"}'::jsonb, TRUE, 4, (SELECT id FROM infraestructura.bloques WHERE codigo = '201'));

-- -----------------------------------------------------
-- Campus 1: Las cuadras - FCE (campus_facultad_id = 2)
-- -----------------------------------------------------

-- Bloque 6: Edif. antiguo FCE (tipo_bloque_id = 1)
INSERT INTO infraestructura.ambientes (nombre, nombre_corto, codigo, piso, capacidad, dimension, clases, tipo_ambiente_id, bloque_id)
VALUES
  ('AULA 501', 'A501', 'FCE-ANT-A501', 1, '{"total": 72, "examen": 36}'::jsonb, '{"largo": 10, "ancho": 8, "alto": 3, "unid_med": "metros"}'::jsonb, TRUE, 2, (SELECT id FROM infraestructura.bloques WHERE codigo = '6')),
  ('AULA 502', 'A502', 'FCE-ANT-A502', 1, '{"total": 72, "examen": 36}'::jsonb, '{"largo": 10, "ancho": 8, "alto": 3, "unid_med": "metros"}'::jsonb, TRUE, 2, (SELECT id FROM infraestructura.bloques WHERE codigo = '6')),
  ('AULA 503', 'A503', 'FCE-ANT-A503', 1, '{"total": 72, "examen": 36}'::jsonb, '{"largo": 10, "ancho": 8, "alto": 3, "unid_med": "metros"}'::jsonb, TRUE, 2, (SELECT id FROM infraestructura.bloques WHERE codigo = '6'));

-- Bloque 7: Edif. nuevo FCE (tipo_bloque_id = 1)
INSERT INTO infraestructura.ambientes (nombre, nombre_corto, codigo, piso, capacidad, dimension, clases, tipo_ambiente_id, bloque_id)
VALUES
  ('AULA 511', 'A511', 'FCE-NUE-A511', 1, '{"total": 81, "examen": 40}'::jsonb, '{"largo": 10, "ancho": 9, "alto": 3, "unid_med": "metros"}'::jsonb, TRUE, 2, (SELECT id FROM infraestructura.bloques WHERE codigo = '7')),
  ('AULA 512', 'A512', 'FCE-NUE-A512', 1, '{"total": 90, "examen": 45}'::jsonb, '{"largo": 12, "ancho": 8, "alto": 3, "unid_med": "metros"}'::jsonb, TRUE, 2, (SELECT id FROM infraestructura.bloques WHERE codigo = '7')),
  ('AUDITORIO FCE', 'AUD', 'FCE-AUD', 0, '{"total": 150, "examen": 75}'::jsonb, '{"largo": 20, "ancho": 12, "alto": 5, "unid_med": "metros"}'::jsonb, TRUE, 3, (SELECT id FROM infraestructura.bloques WHERE codigo = '7'));

-- -----------------------------------------------------
-- Campus 1: Las cuadras - FHCE (campus_facultad_id = 3)
-- -----------------------------------------------------

-- Bloque 9: Edif. Humanidades (tipo_bloque_id = 1)
INSERT INTO infraestructura.ambientes (nombre, nombre_corto, codigo, piso, capacidad, dimension, clases, tipo_ambiente_id, bloque_id)
VALUES
  ('AULA 201', 'A201', 'HUM-A201', 2, '{"total": 88, "examen": 50}'::jsonb, '{"largo": 12, "ancho": 8, "alto": 3, "unid_med": "metros"}'::jsonb, TRUE, 2, (SELECT id FROM infraestructura.bloques WHERE codigo = '9')),
  ('AULA 206 A', 'A206A', 'HUM-A206A', 0, '{"total": 56, "examen": 35}'::jsonb, '{"largo": 8, "ancho": 7, "alto": 3, "unid_med": "metros"}'::jsonb, TRUE, 2, (SELECT id FROM infraestructura.bloques WHERE codigo = '9')),
  ('AULA 206 B', 'A206B', 'HUM-A206B', 0, '{"total": 48, "examen": 20}'::jsonb, '{"largo": 7, "ancho": 6, "alto": 3, "unid_med": "metros"}'::jsonb, TRUE, 2, (SELECT id FROM infraestructura.bloques WHERE codigo = '9')),
  ('AULA MAGNA HUMANIDADES', 'AMH', 'HUM-AMAGNA', 0, '{"total": 225, "examen": 150}'::jsonb, '{"largo": 20, "ancho": 15, "alto": 6, "unid_med": "metros"}'::jsonb, TRUE, 3, (SELECT id FROM infraestructura.bloques WHERE codigo = '9'));

-- -----------------------------------------------------
-- Campus 1: Las cuadras - FCJyP (campus_facultad_id = 4)
-- -----------------------------------------------------

-- Bloque 1: Edif. Cs. Politica (tipo_bloque_id = 1)
INSERT INTO infraestructura.ambientes (nombre, nombre_corto, codigo, piso, capacidad, dimension, clases, tipo_ambiente_id, bloque_id)
VALUES
  ('AULA DE PRACTICA 1', 'DAPRAC1', 'CP-DAPRAC1', 0, '{"total": 50, "examen": 25}'::jsonb, '{"largo": 10, "ancho": 5, "alto": 3, "unid_med": "metros"}'::jsonb, TRUE, 2, (SELECT id FROM infraestructura.bloques WHERE codigo = '1')),
  ('AULA DE PRACTICA 2', 'DAPRAC2', 'CP-DAPRAC2', 0, '{"total": 75, "examen": 38}'::jsonb, '{"largo": 10, "ancho": 7, "alto": 3, "unid_med": "metros"}'::jsonb, TRUE, 2, (SELECT id FROM infraestructura.bloques WHERE codigo = '1')),
  ('AULA MAGNA', 'AMG', 'CP-AMG', 0, '{"total": 50, "examen": 25}'::jsonb, '{"largo": 10, "ancho": 5, "alto": 3, "unid_med": "metros"}'::jsonb, TRUE, 3, (SELECT id FROM infraestructura.bloques WHERE codigo = '1'));

-- -----------------------------------------------------
-- Campus 1: Las cuadras - FACH (campus_facultad_id = 5)
-- -----------------------------------------------------

-- Bloque 171: Bloque principal arquitectura (tipo_bloque_id = 11)
INSERT INTO infraestructura.ambientes (nombre, nombre_corto, codigo, piso, capacidad, dimension, clases, tipo_ambiente_id, bloque_id)
VALUES
  ('TALLER ARQUITECTURA 1', 'TA1', 'ARQ-TALLER1', 1, '{"total": 30, "examen": 15}'::jsonb, '{"largo": 10, "ancho": 6, "alto": 3, "unid_med": "metros"}'::jsonb, TRUE, 5, (SELECT id FROM infraestructura.bloques WHERE codigo = '171')),
  ('TALLER ARQUITECTURA 2', 'TA2', 'ARQ-TALLER2', 2, '{"total": 30, "examen": 15}'::jsonb, '{"largo": 10, "ancho": 6, "alto": 3, "unid_med": "metros"}'::jsonb, TRUE, 5, (SELECT id FROM infraestructura.bloques WHERE codigo = '171')),
  ('AULA ARQUITECTURA', 'AARQ', 'ARQ-AULA', 3, '{"total": 60, "examen": 30}'::jsonb, '{"largo": 12, "ancho": 8, "alto": 3, "unid_med": "metros"}'::jsonb, TRUE, 2, (SELECT id FROM infraestructura.bloques WHERE codigo = '171'));

-- Bloque 172: Arquitectura aulas nuevas (tipo_bloque_id = 1)
INSERT INTO infraestructura.ambientes (nombre, nombre_corto, codigo, piso, capacidad, dimension, clases, tipo_ambiente_id, bloque_id)
VALUES
  ('AULA NUEVA 1', 'AN1', 'ARQ-NUE-A1', 1, '{"total": 70, "examen": 35}'::jsonb, '{"largo": 12, "ancho": 8, "alto": 3, "unid_med": "metros"}'::jsonb, TRUE, 2, (SELECT id FROM infraestructura.bloques WHERE codigo = '172')),
  ('AULA NUEVA 2', 'AN2', 'ARQ-NUE-A2', 2, '{"total": 70, "examen": 35}'::jsonb, '{"largo": 12, "ancho": 8, "alto": 3, "unid_med": "metros"}'::jsonb, TRUE, 2, (SELECT id FROM infraestructura.bloques WHERE codigo = '172'));

-- -----------------------------------------------------
-- Campus 2: Salud - MED (campus_facultad_id = 7)
-- -----------------------------------------------------

-- Bloque 58: Edif. Medicina (tipo_bloque_id = 11)
INSERT INTO infraestructura.ambientes (nombre, nombre_corto, codigo, piso, capacidad, dimension, clases, tipo_ambiente_id, bloque_id)
VALUES
  ('AULA MEDICINA 1', 'AM1', 'MED-A1', 1, '{"total": 80, "examen": 40}'::jsonb, '{"largo": 12, "ancho": 10, "alto": 4, "unid_med": "metros"}'::jsonb, TRUE, 2, (SELECT id FROM infraestructura.bloques WHERE codigo = '58')),
  ('AULA MEDICINA 2', 'AM2', 'MED-A2', 2, '{"total": 80, "examen": 40}'::jsonb, '{"largo": 12, "ancho": 10, "alto": 4, "unid_med": "metros"}'::jsonb, TRUE, 2, (SELECT id FROM infraestructura.bloques WHERE codigo = '58')),
  ('LABORATORIO MEDICINA', 'LM', 'MED-LAB', 1, '{"total": 30, "examen": 15}'::jsonb, '{"largo": 8, "ancho": 6, "alto": 3, "unid_med": "metros"}'::jsonb, TRUE, 4, (SELECT id FROM infraestructura.bloques WHERE codigo = '58'));

-- Bloque 62: Anfiteatro Medicina (tipo_bloque_id = 12)
INSERT INTO infraestructura.ambientes (nombre, nombre_corto, codigo, piso, capacidad, dimension, clases, tipo_ambiente_id, bloque_id)
VALUES
  ('ANFITEATRO MEDICINA', 'ANF-MED', 'MED-ANF', 0, '{"total": 200, "examen": 100}'::jsonb, '{"largo": 20, "ancho": 15, "alto": 8, "unid_med": "metros"}'::jsonb, TRUE, 7, (SELECT id FROM infraestructura.bloques WHERE codigo = '62'));

-- -----------------------------------------------------
-- Campus 2: Salud - ODT (campus_facultad_id = 8)
-- -----------------------------------------------------

-- Bloque 63: Edif. central Odontologia (tipo_bloque_id = 11)
INSERT INTO infraestructura.ambientes (nombre, nombre_corto, codigo, piso, capacidad, dimension, clases, tipo_ambiente_id, bloque_id)
VALUES
  ('CLINICA ODONTOLOGIA', 'CLIN-ODT', 'ODT-CLIN', 1, '{"total": 20, "examen": 10}'::jsonb, '{"largo": 6, "ancho": 5, "alto": 3, "unid_med": "metros"}'::jsonb, TRUE, 9, (SELECT id FROM infraestructura.bloques WHERE codigo = '63')),
  ('AULA ODONTOLOGIA', 'AODT', 'ODT-AULA', 2, '{"total": 60, "examen": 30}'::jsonb, '{"largo": 10, "ancho": 8, "alto": 3, "unid_med": "metros"}'::jsonb, TRUE, 2, (SELECT id FROM infraestructura.bloques WHERE codigo = '63'));

-- -----------------------------------------------------
-- Campus 2: Salud - BQM (campus_facultad_id = 9)
-- -----------------------------------------------------

-- Bloque 65: Edif. central Bioquimica (tipo_bloque_id = 11)
INSERT INTO infraestructura.ambientes (nombre, nombre_corto, codigo, piso, capacidad, dimension, clases, tipo_ambiente_id, bloque_id)
VALUES
  ('LABORATORIO BIOQUIMICA 1', 'LBQ1', 'BQM-LAB1', 1, '{"total": 25, "examen": 12}'::jsonb, '{"largo": 7, "ancho": 5, "alto": 3, "unid_med": "metros"}'::jsonb, TRUE, 4, (SELECT id FROM infraestructura.bloques WHERE codigo = '65')),
  ('LABORATORIO BIOQUIMICA 2', 'LBQ2', 'BQM-LAB2', 2, '{"total": 25, "examen": 12}'::jsonb, '{"largo": 7, "ancho": 5, "alto": 3, "unid_med": "metros"}'::jsonb, TRUE, 4, (SELECT id FROM infraestructura.bloques WHERE codigo = '65')),
  ('AULA BIOQUIMICA', 'ABQM', 'BQM-AULA', 3, '{"total": 50, "examen": 25}'::jsonb, '{"largo": 10, "ancho": 8, "alto": 3, "unid_med": "metros"}'::jsonb, TRUE, 2, (SELECT id FROM infraestructura.bloques WHERE codigo = '65'));

-- -----------------------------------------------------
-- Campus 3: Tamborada - FCAPyF (campus_facultad_id = 10)
-- -----------------------------------------------------

-- Bloque 74: Edif. central Agronomia (tipo_bloque_id = 11)
INSERT INTO infraestructura.ambientes (nombre, nombre_corto, codigo, piso, capacidad, dimension, clases, tipo_ambiente_id, bloque_id)
VALUES
  ('AULA AGRONOMIA 1', 'AA1', 'AGR-A1', 1, '{"total": 70, "examen": 35}'::jsonb, '{"largo": 12, "ancho": 8, "alto": 3, "unid_med": "metros"}'::jsonb, TRUE, 2, (SELECT id FROM infraestructura.bloques WHERE codigo = '74')),
  ('AULA AGRONOMIA 2', 'AA2', 'AGR-A2', 2, '{"total": 70, "examen": 35}'::jsonb, '{"largo": 12, "ancho": 8, "alto": 3, "unid_med": "metros"}'::jsonb, TRUE, 2, (SELECT id FROM infraestructura.bloques WHERE codigo = '74')),
  ('LABORATORIO SUELOS', 'LS', 'AGR-LAB-SUELOS', 0, '{"total": 20, "examen": 10}'::jsonb, '{"largo": 6, "ancho": 5, "alto": 3, "unid_med": "metros"}'::jsonb, TRUE, 4, (SELECT id FROM infraestructura.bloques WHERE codigo = '74'));

-- -----------------------------------------------------
-- Campus 3: Tamborada - DRT (campus_facultad_id = 11)
-- -----------------------------------------------------

-- Bloque 110: Bloque A ETSA (tipo_bloque_id = 11)
INSERT INTO infraestructura.ambientes (nombre, nombre_corto, codigo, piso, capacidad, dimension, clases, tipo_ambiente_id, bloque_id)
VALUES
  ('AULA ETSA 1', 'AE1', 'ETSA-A1', 1, '{"total": 40, "examen": 20}'::jsonb, '{"largo": 8, "ancho": 6, "alto": 3, "unid_med": "metros"}'::jsonb, TRUE, 2, (SELECT id FROM infraestructura.bloques WHERE codigo = '110')),
  ('AULA ETSA 2', 'AE2', 'ETSA-A2', 1, '{"total": 40, "examen": 20}'::jsonb, '{"largo": 8, "ancho": 6, "alto": 3, "unid_med": "metros"}'::jsonb, TRUE, 2, (SELECT id FROM infraestructura.bloques WHERE codigo = '110'));

-- Bloque 115: Aula Magna ETSA (tipo_bloque_id = 14)
INSERT INTO infraestructura.ambientes (nombre, nombre_corto, codigo, piso, capacidad, dimension, clases, tipo_ambiente_id, bloque_id)
VALUES
  ('AULA MAGNA ETSA', 'AM-ETSA', 'ETSA-AMAGNA', 0, '{"total": 150, "examen": 75}'::jsonb, '{"largo": 18, "ancho": 12, "alto": 6, "unid_med": "metros"}'::jsonb, TRUE, 3, (SELECT id FROM infraestructura.bloques WHERE codigo = '115'));

-- -----------------------------------------------------
-- Campus 4: Quillacollo - FCV (campus_facultad_id = 12)
-- -----------------------------------------------------

-- Bloque 124: Edif. Veterinaria (tipo_bloque_id = 11)
INSERT INTO infraestructura.ambientes (nombre, nombre_corto, codigo, piso, capacidad, dimension, clases, tipo_ambiente_id, bloque_id)
VALUES
  ('AULA VETERINARIA 1', 'AV1', 'VET-A1', 1, '{"total": 60, "examen": 30}'::jsonb, '{"largo": 10, "ancho": 8, "alto": 3, "unid_med": "metros"}'::jsonb, TRUE, 2, (SELECT id FROM infraestructura.bloques WHERE codigo = '124')),
  ('AULA VETERINARIA 2', 'AV2', 'VET-A2', 2, '{"total": 60, "examen": 30}'::jsonb, '{"largo": 10, "ancho": 8, "alto": 3, "unid_med": "metros"}'::jsonb, TRUE, 2, (SELECT id FROM infraestructura.bloques WHERE codigo = '124')),
  ('CLINICA VETERINARIA', 'CLIN-VET', 'VET-CLIN', 0, '{"total": 10, "examen": 5}'::jsonb, '{"largo": 5, "ancho": 4, "alto": 3, "unid_med": "metros"}'::jsonb, TRUE, 9, (SELECT id FROM infraestructura.bloques WHERE codigo = '124')),
  ('ESTABLO', 'EST', 'VET-ESTABLO', 0, '{"total": 50, "examen": 0}'::jsonb, '{"largo": 20, "ancho": 10, "alto": 4, "unid_med": "metros"}'::jsonb, FALSE, 11, (SELECT id FROM infraestructura.bloques WHERE codigo = '124'));

-- -----------------------------------------------------
-- Campus 5: Temporal - ESFOR (campus_facultad_id = 13)
-- -----------------------------------------------------

-- Bloque 67: Edif. central ESFOR (tipo_bloque_id = 11)
INSERT INTO infraestructura.ambientes (nombre, nombre_corto, codigo, piso, capacidad, dimension, clases, tipo_ambiente_id, bloque_id)
VALUES
  ('AULA ESFOR 1', 'AE1', 'ESFOR-A1', 0, '{"total": 40, "examen": 20}'::jsonb, '{"largo": 8, "ancho": 6, "alto": 3, "unid_med": "metros"}'::jsonb, TRUE, 2, (SELECT id FROM infraestructura.bloques WHERE codigo = '67')),
  ('AULA ESFOR 2', 'AE2', 'ESFOR-A2', 0, '{"total": 40, "examen": 20}'::jsonb, '{"largo": 8, "ancho": 6, "alto": 3, "unid_med": "metros"}'::jsonb, TRUE, 2, (SELECT id FROM infraestructura.bloques WHERE codigo = '67'));

-- Bloque 70: Comedor ESFOR (tipo_bloque_id = 13)
INSERT INTO infraestructura.ambientes (nombre, nombre_corto, codigo, piso, capacidad, dimension, clases, tipo_ambiente_id, bloque_id)
VALUES
  ('COMEDOR PRINCIPAL', 'COM', 'ESFOR-COMEDOR', 0, '{"total": 200, "examen": 0}'::jsonb, '{"largo": 25, "ancho": 15, "alto": 4, "unid_med": "metros"}'::jsonb, FALSE, 10, (SELECT id FROM infraestructura.bloques WHERE codigo = '70'));

-- Bloque 71: Talleres ESFOR (tipo_bloque_id = 8)
INSERT INTO infraestructura.ambientes (nombre, nombre_corto, codigo, piso, capacidad, dimension, clases, tipo_ambiente_id, bloque_id)
VALUES
  ('TALLER 1', 'T1', 'ESFOR-T1', 0, '{"total": 20, "examen": 10}'::jsonb, '{"largo": 8, "ancho": 6, "alto": 4, "unid_med": "metros"}'::jsonb, TRUE, 5, (SELECT id FROM infraestructura.bloques WHERE codigo = '71')),
  ('TALLER 2', 'T2', 'ESFOR-T2', 0, '{"total": 20, "examen": 10}'::jsonb, '{"largo": 8, "ancho": 6, "alto": 4, "unid_med": "metros"}'::jsonb, TRUE, 5, (SELECT id FROM infraestructura.bloques WHERE codigo = '71'));
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
DELETE FROM infraestructura.ambientes;
    `);
  }
}

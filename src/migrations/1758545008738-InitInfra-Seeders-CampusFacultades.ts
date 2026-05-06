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
  ('1', 'Las cuadras', 'Av. Sucre entre Oquendo y Belzu', POINT(-17.393498, -66.145992)),
  ('2', 'Salud', 'Entre Aniceto arce y Venezuela', POINT(-17.387393, -66.149539)),
  ('3', 'Tamborada', 'Av. Petrolera km 5, Zona la Tamborada', POINT(-17.450072, -66.133656)),
  ('4', 'Quillacollo', 'Predios de la Ex casa Hoschield, Tacata norte', POINT(-17.380368, -66.289096)),
  ('5', 'Temporal', 'Av. Atahuallpa final, barrio prefectual, lado de Diprove', POINT(-17.350790, -66.155407)),
  ('6', 'Punata', 'Valle alto', POINT(-17.542904, -65.843325)),
  ('7', 'Polifuncional', 'Av. Jordan entre Ayacucho y Nataniel Aguirre', POINT(-17.395464, -66.157559));

-- Facultades (sin campus_id, ahora se Relacionan via campus_facultades)
INSERT INTO infraestructura.facultades (codigo, nombre, nombre_corto, coordenadas)
VALUES
  ('20', 'CIENCIAS Y TECNOLOGIA', 'FCyT', POINT(-17.393267, -66.144950)),
  ('13', 'CIENCIAS ECONOMICAS', 'FCE', POINT(-17.394840, -66.147865)),
  ('18', 'HUMANIDADES Y CS. DE LA EDUCACION', 'FHCE', POINT(-17.393009, -66.147834)),
  ('19', 'CIENCIAS JURIDICAS Y POLITICAS', 'FCJyP', POINT(-17.393150, -66.148654)),
  ('17', 'ARQUITECTURA Y CIENCIAS DEL HABITAT', 'FACH', POINT(-17.394976, -66.146846)),
  ('23', 'CIENCIAS SOCIALES', 'SOC', POINT(-17.393150, -66.148654)),
  
  ('16', 'MEDICINA', 'MED', POINT(-17.387348, -66.149420)),
  ('15', 'ODONTOLOGIA', 'ODT', POINT(-17.386703, -66.149857)),
  ('12', 'CS. FARMACEUTICAS Y BIOQUIMICAS', 'BQM', POINT(-17.387154, -66.149459)),
  
  ('10', 'CIENCIAS AGRICOLAS Y PECUARIAS', 'FCAPyF', POINT(-17.450068, -66.133971)),
  ('14', 'DESARROLLO RURAL Y TERRITORIAL', 'DRT', POINT(-17.451490, -66.133164)),
  
  ('27', 'CIENCIAS VETERINARIAS', 'FCV', POINT(-17.380268, -66.289035)),
  
  ('21', 'POLITECNICA DEL VALLE ALTO', 'IPU', POINT(-17.542904, -65.843325)),

  ('29', 'ENFERMERIA', 'ENF', POINT(-17.395464, -66.157559));

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
  (1, 6), -- CIENCIAS SOCIALES
  
  -- Campus 2: Salud
  (2, 7),  -- MEDICINA
  (2, 8), -- ODONTOLOGIA
  (2, 9), -- CS. FARMACEUTICAS Y BIOQUIMICAS

  -- Campus 3: Tamborada
  (3, 10),  -- CIENCIAS AGRICOLAS Y PECUARIAS
  (3, 11), -- DESARROLLO RURAL Y TERRITORIAL

  -- Campus 4: Quillacollo
  (4, 12),  -- CIENCIAS VETERINARIAS

  -- Campus 5: Temporal
  (5, 10),  -- CIENCIAS AGRICOLAS Y PECUARIAS

  -- Campus 6: Punata
  (6, 13), -- POLITECNICA DEL VALLE ALTO
  
  -- Campus 7: Polifuncional
  (7, 14); -- ENFERMERIA
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

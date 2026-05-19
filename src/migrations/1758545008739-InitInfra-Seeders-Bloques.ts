import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitInfraSeedersBloques1758545008739 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
-- =====================================================
-- SEEDERS: BLOQUES
-- =====================================================

INSERT INTO infraestructura.bloques (codigo, nombre, nombre_corto, pisos, coordenadas, campus_facultad_id, tipo_bloque_id)
VALUES
('1',  'EDIF. FACULTAD DE CS. POLITICA',  NULL,  0,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '4'),  4,  1),
('6',  'EDIF. ANTIGUO FAC. DE ECONOMIA',  NULL,  1,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '2'),  2,  1),
('7',  'EDIF. NUEVO FAC. DE ECONOMIA',  NULL,  1,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '2'),  2,  1),
('9',  'EDIFICIO FAC. DE HUMANIDADES',  NULL,  1,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '3'),  3,  1),
('10',  'FAC. HUMANIDADES - AULAS 1',  NULL,  1,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '3'),  3,  1),
('11',  'FAC. HUMANIDADES - AULAS 2',  NULL,  2,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '3'),  3,  1),
('12',  'SECTOR "INFORMATICA"',  NULL,  0,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '1'),  1,  2),
('13',  'EDIFICIO PROMEC-IESE',  NULL,  1,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '2'),  2,  3),
('14',  'BLOQUE TALLERES CARPINT. PDTF',  NULL,  1,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '1'),  1,  4),
('15',  'BLOQUE "TRENCITO"',  NULL,  0,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '1'),  1,  1),
('24',  'EDIF. "ADMINISTRACION CENTRAL"',  NULL,  2,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '1'),  1,  1),
('25',  'SECTOR "MATEMATICAS"',  NULL,  0,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '1'),  1,  1),
('26',  'EDIF. "ELEKTRO"',  NULL,  3,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '1'),  1,  1),
('27',  'BLOQUE "TINGLADOS"',  NULL,  0,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '1'),  1,  5),
('28',  'SECTOR "BIOLOGIA"',  NULL,  1,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '1'),  1,  6),
('30',  'SECTOR "FISICA"',  NULL,  1,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '1'),  1,  6),
('31',  'NUEVO PDTF',  NULL,  0,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '1'),  1,  7),
('33',  'SECTOR "QUIMICA"',  NULL,  1,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '1'),  1,  6),
('36',  'CASETA FACULTAD DE HUMANIDADES',  NULL,  0,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '3'),  3,  15),
('37',  'BLOQUE ANTIGUO PROG. AGROQUIM.',  NULL,  1,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '1'),  1,  1),
('38',  'BLOQUE NUEVO PROG. AGROQUIM.',  NULL,  0,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '1'),  1,  1),
('45',  'EDIFICIO "MEMI"',  NULL,  2,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '1'),  1,  7),
('46',  'SECTOR "ALIMENTOS Y AGUAS"',  NULL,  1,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '1'),  1,  6),
('47',  'BLOQUE "INGENIERIA INDUSTRIAL"',  NULL,  1,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '1'),  1,  6),
('48',  'BLOQUE "EX UPAY - TIZAS"',  NULL,  0,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '1'),  1,  1),
('49',  'EDIFICIO ACADEMICO MULTIPLE',  NULL,  2,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '3'),  3,  7),
('58',  'EDIF. CENTRAL FAC. MEDICINA',  NULL,  0,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '7'),  7,  7),
('62',  'ANFITEATRO DE MEDICINA',  NULL,  1,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '7'),  7,  8),
('63',  'EDIF. CENTRAL FAC. ODONTOLOGIA',  NULL,  3,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '9'),  9,  7),
('64',  'ANFITEATRO FAC. ODONTOLOGIA',  NULL,  0,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '9'),  9,  8),
('65',  'EDIF. CENTRAL FAC. BIOQUIMICA',  NULL,  7,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '8'),  8,  7),
('66',  'CANAL 11 TELEV. UNIVERSITARIA',  NULL,  0,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '16'),  16,  7),
('67',  'EDIFICIO CENTRAL ETSFOR',  NULL,  0,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '13'),  13,  6),
('70',  'COMEDOR - COCINA ETSFOR',  NULL,  0,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '13'),  13,  9),
('71',  'TALLERES ETSFOR',  NULL,  0,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '13'),  13,  10),
('74',  'EDIF. CENTRAL FAC. AGRONOMIA',  NULL,  1,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '10'),  10,  7),
('90',  'PROYECTO PROLADE',  NULL,  0,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '10'),  10,  11),
('95',  'APRISCO',  NULL,  0,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '10'),  10,  16),
('99',  'LABORATORIO DE SUELOS',  NULL,  0,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '10'),  10,  17),
('100',  'PROYECTO AGRUCO',  NULL,  0,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '10'),  10,  15),
('104',  'PROYECTO CENTRO AGUAS',  NULL,  0,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '10'),  10,  15),
('110',  'BLOQUE A (ED. ADMINISTRA ETSA)',  NULL,  0,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '11'),  11,  7),
('111',  'BLOQUE B (AULAS ETSA)',  NULL,  0,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '11'),  11,  7),
('115',  'BLOQUE C (AULA MAGNA ETSA)',  NULL,  0,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '11'),  11,  12),
('116',  'BLOQUE D (MODULOS DE PRACTICAS',  NULL,  0,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '11'),  11,  15),
('117',  'OFICINAS Y AULAS CIFEMA',  NULL,  0,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '10'),  10,  7),
('123',  'LABORATORIO HIDRAULICA',  NULL,  0,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '17'),  17,  15),
('124',  'EDIF CARRERA VETERINARIA',  NULL,  1,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '10'),  10,  1),
('125',  'GEOTECNIA',  NULL,  0,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '1'),  1,  15),
('127',  'OFICINAS LABORATORIOS CIF',  NULL,  0,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '10'),  10,  15),
('137',  'EDIFICIO MULTIPLE',  NULL,  1,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '10'),  10,  7),
('141',  'LABORATORIO LA JOTA',  NULL,  1,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '10'),  10,  15),
('146',  'EX - BANCO DEL ESTADO',  NULL,  2,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '15'),  15,  7),
('147',  'CORO Y DEPOSITO MUSEO',  NULL,  0,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '3'),  3,  15),
('151',  'EDIFICIO PROTOTIPO ECONOMIA 1',  NULL,  3,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '2'),  2,  7),
('153',  'ECO. CENTRO DE CONVENCIONES',  NULL,  0,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '2'),  2,  12),
('171',  'ARQ. BLOQUE PRINCIPAL',  NULL,  1,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '5'),  5,  7),
('172',  'ARQ. AULAS NUEVAS',  NULL,  4,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '5'),  5,  1),
('173',  'ARQ. SALAS DE AUDIVISUALES',  NULL,  0,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '5'),  5,  13),
('174',  'ARQ. BLOQUE GALLINEROS',  NULL,  0,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '5'),  5,  1),
('176',  'EDIF.NUEVO FAC. DERECHO',  NULL,  6,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '4'),  4,  7),
('179',  'EDIFICIO I.P.U.',  NULL,  1,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '14'),  14,  7),
('184',  'EDIFICIO NUEVO FAC. HUM.',  NULL,  4,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '3'),  3,  1),
('185',  'EDIF. NUEVO FAC. MEDICINA',  NULL,  4,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '7'),  7,  7),
('186',  'EDIF. NUEVO FCYT',  NULL,  2,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '1'),  1,  7),
('187',  'EDIF. PROTOTIPO ECONOMIA III',  NULL,  3,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '2'),  2,  1),
('191',  'NUEVO EDIF. ACADEMICO 2 (FCYT)',  NULL,  3,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '1'),  1,  1),
('195',  'EDIFICIO NUEVO FAC. HUM. 2',  NULL,  4,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '3'),  3,  7),
('196',  'EDIF. NUEVO FAC. ODONTOLOGIA',  NULL,  5,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '9'),  9,  7),
('197',  'EDIF. ACADEMICO FAC. ECONOMIA',  NULL,  4,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '2'),  2,  1),
('198',  'EDIFICIO AULAS TALLER',  NULL,  4,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '5'),  5,  7),
('199',  'EDIFICIO DE POSGRADO FCE',  NULL,  2,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '18'),  18,  7),
('201',  'EDIF. FACULTATIVO LAB. BASICOS',  NULL,  4,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '1'),  1,  14),
('202',  'CALLE SUCRE # 593',  NULL,  1,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '6'),  6,  1),
('209',  'CALLE BERNARDO MONTEAGUDO 1298',  NULL,  1,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '19'),  19,  1),
('210',  'AMBIENTES QUILLACOLLO',  NULL,  0,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '20'),  20,  1),
('211',  'AMBIENTES SACABA',  NULL,  0,  (SELECT c.coordenadas FROM infraestructura.campus_facultades cf JOIN infraestructura.campus c ON cf.campus_id = c.id WHERE cf.id = '21'),  21,  1);
`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
DELETE FROM infraestructura.bloques;
    `);
  }
}

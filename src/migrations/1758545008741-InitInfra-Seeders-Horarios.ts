import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitInfraSeedersHorarios1758545008741 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
-- =====================================================
-- SEEDERS: HORARIOS DE OPERACIÓN (MOCK)
-- Para todos los ambientes:
-- - Día 0-4 (Lun-Vie): 06:30 a 10:30, periodo 45
-- - Día 5 (Sab): 06:30 a 12:45, periodo 45
-- =====================================================

-- Horarios para todos los ambientes (días 0-4: lunes a viernes)
INSERT INTO infraestructura.horarios_operacion (ambiente_id, dia, hora_inicio, hora_fin, periodo)
SELECT
  a.id AS ambiente_id,
  d.dia,
  '06:30:00'::time AS hora_inicio,
  '22:30:00'::time AS hora_fin,
  30 AS periodo
FROM infraestructura.ambientes a
CROSS JOIN (VALUES (0), (1), (2), (3), (4)) AS d(dia)
WHERE a.activo = TRUE;

-- Horarios para todos los ambientes (día 5: sábado)
INSERT INTO infraestructura.horarios_operacion (ambiente_id, dia, hora_inicio, hora_fin, periodo)
SELECT
  a.id AS ambiente_id,
  5 AS dia,
  '06:30:00'::time AS hora_inicio,
  '13:00:00'::time AS hora_fin,
  30 AS periodo
FROM infraestructura.ambientes a
WHERE a.activo = TRUE;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
DELETE FROM infraestructura.horarios_operacion;
    `);
  }
}

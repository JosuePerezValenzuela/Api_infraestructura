import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedAmbientesBatch1760000000006 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // TODO: Add raw SQL inserts for ambientes batch seeding.
    await queryRunner.query(
      `
          INSERT INTO infraestructura.ambientes (nombre, nombre_corto, codigo, piso, capacidad, dimension, clases, tipo_ambiente_id, bloque_id)
          VALUES
            ('691A', '691', '69111', 1, '{"total": 45, "examen":35}'::jsonb, '{"largo": 30, "ancho": 8, "alto": 3.4, "unid_med": "metros"}'::jsonb, TRUE, 1, 1),
            ('Laboratorio', 'LAbo', '77777', 0, '{"total": 30, "examen": 15}'::jsonb, '{"largo": 20, "ancho": 6, "alto": 3.4, "unid_med": "metros"}'::jsonb, TRUE, 1, 2),
            ('Laboratorio de redes 1', 'LabRed', '55555', 0, '{"total": 15, "examen": 1}'::jsonb, '{"largo": 15, "ancho": 8, "alto": 3.4, "unid_med": "metros"}'::jsonb, TRUE, 3, 2),
            ('Auditorio Central', 'AudCentral', 'AUD-001', 0, '{"total": 250, "examen": 200}'::jsonb, '{"largo": 40, "ancho": 20, "alto": 8, "unid_med": "metros"}'::jsonb, FALSE, 4, 4),
            ('Sala Consejo Academico', 'Consejo', 'CON-001', 1, '{"total": 40, "examen": 0}'::jsonb, '{"largo": 18, "ancho": 10, "alto": 4, "unid_med": "metros"}'::jsonb, FALSE, 5, 4),
            ('Laboratorio de Suelos', 'LabSuelos', 'LAB-AGR-01', 0, '{"total": 20, "examen": 10}'::jsonb, '{"largo": 18, "ancho": 9, "alto": 3.8, "unid_med": "metros"}'::jsonb, TRUE, 2, 6),
            ('Taller de Maquetas', 'Maquetas', 'TALL-ARQ-1', 1, '{"total": 35, "examen": 25}'::jsonb, '{"largo": 25, "ancho": 12, "alto": 4, "unid_med": "metros"}'::jsonb, TRUE, 1, 7);
        `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
          DELETE FROM infraestructura.ambientes
          WHERE codigo IN (
            '69111',
            '77777',
            '55555',
            'AUD-001',
            'CON-001',
            'LAB-AGR-01',
            'TALL-ARQ-1'
          );
        `,
    );
  }
}

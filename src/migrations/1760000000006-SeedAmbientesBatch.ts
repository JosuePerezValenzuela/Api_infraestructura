import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedAmbientesBatch1760000000006 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // TODO: Add raw SQL inserts for ambientes batch seeding.
    try {
      await queryRunner.startTransaction();
      await queryRunner.query(
        `
          INSERT INTO infraestructura.ambientes (nombre, nombre_corto, codigo, piso, capacidad, dimension, clases, tipo_ambiente_id, bloque_id)
          VALUES
            ('691A', '691', '69111', 1, '{"total": 45, "examen":35}'::jsonb, '{"largo": 30, "ancho": 8, "alto": 3.4, "unid_med": "metros"}'::jsonb, TRUE, 1, 1),
            ('Laboratorio', 'LAbo', '77777', 0, '{"total": 30, "examen": 15}'::jsonb, '{"largo": 20, "ancho": 6, "alto": 3.4, "unid_med": "metros"}'::jsonb, TRUE, 1, 2),
            ('Laboratorio de redes 1', 'LabRed', '55555', 0, '{"total": 15, "examen": 1}'::jsonb, '{"largo": 15, "ancho": 8, "alto": 3.4, "unid_med": "metros"}'::jsonb, TRUE, 3, 2);
        `,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // TODO: Add raw SQL deletes to revert ambientes batch seeding.
  }
}

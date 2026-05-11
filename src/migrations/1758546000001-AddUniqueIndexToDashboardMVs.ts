import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueIndexToDashboardMVs1758546000001
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Índice único para MV de campus_resumen (necesario para REFRESH CONCURRENTLY)
    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_mv_dashboard_campus_resumen_campus_id
      ON mv_dashboard_campus_resumen (campus_id);
    `);

    // Índice único para MV de tipos_bloque (necesario para REFRESH CONCURRENTLY)
    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_mv_dashboard_tipos_bloque_campus_tipo
      ON mv_dashboard_tipos_bloque (campus_id, tipo_bloque_id);
    `);

    // Índice único para MV de tipos_ambiente (necesario para REFRESH CONCURRENTLY)
    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_mv_dashboard_tipos_ambiente_campus_tipo
      ON mv_dashboard_tipos_ambiente (campus_id, tipo_ambiente_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_mv_dashboard_campus_resumen_campus_id;
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_mv_dashboard_tipos_bloque_campus_tipo;
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_mv_dashboard_tipos_ambiente_campus_tipo;
    `);
  }
}
import { MigrationInterface, QueryRunner } from 'typeorm';

export class DashboardMaterializedViews1758546000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Vista materializada para dashboard global de campus (resumen - sin filtro de activo)
    await queryRunner.query(`
      CREATE MATERIALIZED VIEW mv_dashboard_campus_resumen AS
      SELECT
        c.id AS campus_id,
        c.nombre AS campus_nombre,
        c.activo AS campus_activo,
        COUNT(DISTINCT cf.facultad_id) FILTER (WHERE cf.facultad_id IS NOT NULL) AS facultades_total,
        COUNT(DISTINCT cf.facultad_id) FILTER (WHERE cf.activo = TRUE) AS facultades_activos,
        COUNT(DISTINCT cf.facultad_id) FILTER (WHERE cf.activo = FALSE) AS facultades_inactivos,
        COUNT(DISTINCT b.id) FILTER (WHERE b.id IS NOT NULL) AS bloques_total,
        COUNT(DISTINCT b.id) FILTER (WHERE b.activo = TRUE) AS bloques_activos,
        COUNT(DISTINCT b.id) FILTER (WHERE b.activo = FALSE) AS bloques_inactivos,
        COUNT(DISTINCT a.id) FILTER (WHERE a.id IS NOT NULL) AS ambientes_total,
        COUNT(DISTINCT a.id) FILTER (WHERE a.activo = TRUE) AS ambientes_activos,
        COUNT(DISTINCT a.id) FILTER (WHERE a.activo = FALSE) AS ambientes_inactivos,
        COALESCE(SUM((a.capacidad->>'total')::int), 0) AS capacidad_total,
        COALESCE(SUM((a.capacidad->>'examen')::int), 0) AS capacidad_examen,
        COUNT(act.id) FILTER (WHERE act.id IS NOT NULL) AS activos_asignados
      FROM infraestructura.campus c
      LEFT JOIN infraestructura.campus_facultades cf ON cf.campus_id = c.id
      LEFT JOIN infraestructura.facultades f ON f.id = cf.facultad_id
      LEFT JOIN infraestructura.bloques b ON b.campus_facultad_id = cf.id
      LEFT JOIN infraestructura.ambientes a ON a.bloque_id = b.id
      LEFT JOIN infraestructura.activos act ON act.ambiente_id = a.id
      GROUP BY c.id, c.nombre, c.activo
      ORDER BY c.nombre ASC;
    `);

    // Vista materializada para tipos de bloque por campus (sin filtro de activo)
    await queryRunner.query(`
      CREATE MATERIALIZED VIEW mv_dashboard_tipos_bloque AS
      SELECT
        c.id AS campus_id,
        c.nombre AS campus_nombre,
        tb.id AS tipo_bloque_id,
        tb.nombre AS tipo_bloque_nombre,
        COUNT(b.id)::int AS cantidad
      FROM infraestructura.campus c
      LEFT JOIN infraestructura.campus_facultades cf ON cf.campus_id = c.id
      LEFT JOIN infraestructura.facultades f ON f.id = cf.facultad_id
      LEFT JOIN infraestructura.bloques b ON b.campus_facultad_id = cf.id
      LEFT JOIN infraestructura.tipo_bloques tb ON tb.id = b.tipo_bloque_id
      GROUP BY c.id, c.nombre, tb.id, tb.nombre
      ORDER BY c.nombre, cantidad DESC;
    `);

    // Vista materializada para tipos de ambiente por campus (sin filtro de activo)
    await queryRunner.query(`
      CREATE MATERIALIZED VIEW mv_dashboard_tipos_ambiente AS
      SELECT
        c.id AS campus_id,
        c.nombre AS campus_nombre,
        ta.id AS tipo_ambiente_id,
        ta.nombre AS tipo_ambiente_nombre,
        COUNT(a.id)::int AS cantidad
      FROM infraestructura.campus c
      LEFT JOIN infraestructura.campus_facultades cf ON cf.campus_id = c.id
      LEFT JOIN infraestructura.facultades f ON f.id = cf.facultad_id
      LEFT JOIN infraestructura.bloques b ON b.campus_facultad_id = cf.id
      LEFT JOIN infraestructura.ambientes a ON a.bloque_id = b.id
      LEFT JOIN infraestructura.tipo_ambientes ta ON ta.id = a.tipo_ambiente_id
      GROUP BY c.id, c.nombre, ta.id, ta.nombre
      ORDER BY c.nombre, cantidad DESC;
    `);

    // Vista materializada para activos no asignados
    await queryRunner.query(`
      CREATE MATERIALIZED VIEW mv_dashboard_activos_no_asignados AS
      SELECT COUNT(*)::int AS cantidad
      FROM infraestructura.activos act
      WHERE act.ambiente_id IS NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP MATERIALIZED VIEW IF EXISTS mv_dashboard_campus_resumen`);
    await queryRunner.query(`DROP MATERIALIZED VIEW IF EXISTS mv_dashboard_tipos_bloque`);
    await queryRunner.query(`DROP MATERIALIZED VIEW IF EXISTS mv_dashboard_tipos_ambiente`);
    await queryRunner.query(`DROP MATERIALIZED VIEW IF EXISTS mv_dashboard_activos_no_asignados`);
  }
}
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import {
  CreateFacultadData,
  FacultadRepositoryPort,
  RelatedBlock,
} from '../../domain/facultad.repository.port';
import {
  facultadCompleta,
  ListFacultadesQuery,
  ListFacultadesResult,
  UpdateFacultadesInput,
} from '../../domain/facultad.list.types';

export class TypeormFacultadRepository implements FacultadRepositoryPort {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async isCodeTaken(codigo: string, excludeId?: number): Promise<boolean> {
    let sql = `
      SELECT 1 AS existe
      FROM infraestructura.facultades
      WHERE codigo = $1
    `;
    const params: any[] = [codigo];
    if (excludeId) {
      sql += ' AND id != $2';
      params.push(excludeId);
    }

    const rows: [] = await this.dataSource.query(sql, params);
    return rows.length > 0;
  }

  async create(data: CreateFacultadData): Promise<{ id: number }> {
    // Insertar facultad sin coordenadas
    const sql = `
      INSERT INTO infraestructura.facultades (codigo, nombre, nombre_corto)
      VALUES ($1, $2, $3)
      RETURNING id
    `;

    const params = [data.codigo, data.nombre, data.nombre_corto];

    const rows: Array<{ id: string }> = await this.dataSource.query(sql, params);

    const [row] = rows;
    const facultadId = Number(row.id);

    // Insertar relaciones en campus_facultades
    if (data.campus_ids && data.campus_ids.length > 0) {
      const values: string[] = [];
      const relParams: (string | number)[] = [];
      let paramIndex = 1;

      for (const campusId of data.campus_ids) {
        values.push(`($${paramIndex++}, $${paramIndex++})`);
        relParams.push(campusId, facultadId);
      }

      const relSql = `
        INSERT INTO infraestructura.campus_facultades (campus_id, facultad_id)
        VALUES ${values.join(', ')}
      `;

      await this.dataSource.query(relSql, relParams);
    }

    return { id: facultadId };
  }

  async findById(id: number): Promise<facultadCompleta | null> {
    const sql = `
    SELECT
      f.id,
      f.codigo,
      f.nombre,
      f.nombre_corto,
      f.activo,
      (
        SELECT cf.campus_id
        FROM infraestructura.campus_facultades cf
        WHERE cf.facultad_id = f.id AND cf.activo = true
        ORDER BY cf.campus_id
        LIMIT 1
      ) AS campus_id,
      (
        SELECT ARRAY_AGG(cf2.campus_id)
        FROM infraestructura.campus_facultades cf2
        WHERE cf2.facultad_id = f.id AND cf2.activo = true
      ) AS campus_ids
    FROM infraestructura.facultades f
    WHERE f.id = $1
    LIMIT 1
    `;

    const rows = await this.dataSource.query<facultadCompleta[]>(sql, [id]);
    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    return {
      ...row,
      campus_ids: row.campus_ids ?? [],
    };
  }

  async findPaginated(
    opts: ListFacultadesQuery,
  ): Promise<ListFacultadesResult> {
    // Cantidad de registros que debemos saltar antes de empezar a mostrar resultados
    const offset = (opts.page - 1) * opts.take;

    const filterParams: Array<string | number | boolean> = [];

    const whereClauses: string[] = [];

    // Si se envia un texto de busqueda
    if (opts.search && opts.search.trim().length > 0) {
      const pattern = `%${opts.search.trim()}%`;

      const codigoIndex = filterParams.length + 1;
      filterParams.push(pattern);

      const nombreIndex = filterParams.length + 1;
      filterParams.push(pattern);

      const campusIndex = filterParams.length + 1;
      filterParams.push(pattern);

      whereClauses.push(
        `(f.codigo ILIKE $${codigoIndex} OR f.nombre ILIKE $${nombreIndex} OR c.nombre ILIKE $${campusIndex} OR cf.campus_id::text ILIKE $${campusIndex})`,
      );
    }

    if (opts.activo !== undefined) {
      const idx = filterParams.length + 1;
      filterParams.push(opts.activo);
      whereClauses.push(`f.activo = $${idx}`);
    }

    // Union de todas las clausulas
    const whereSql =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Mapeo de los nombres de ordenamiento permitidos a sus columnas reales
    const orderByMap: Record<ListFacultadesQuery['orderBy'], string> = {
      nombre: 'f.nombre',
      codigo: 'f.codigo',
      creado_en: 'f.creado_en',
    };

    // Construccion de la consulta
    const countSql = `
      SELECT COUNT(DISTINCT f.id)::int AS total
      FROM infraestructura.facultades f
      LEFT JOIN infraestructura.campus_facultades cf ON cf.facultad_id = f.id
      LEFT JOIN infraestructura.campus c ON c.id = cf.campus_id
      ${whereSql}
    `;

    // Ejecucion de la consulta de conteo
    const countRows: Array<{ total: number }> = await this.dataSource.query(
      countSql,
      filterParams,
    );

    // Extraccion de todo, si esta vacio asumimos 0
    const total = countRows[0]?.total ?? 0;

    // Copiamos los parametros de filtro para reutilizarlos en la consulta principal
    const dataParams = [...filterParams];
    // Calculamos el indice que ocupara LIMIT
    const limitIndex = dataParams.length + 1;
    dataParams.push(opts.take);

    // Calculamos el indice que tomara el offset
    const offsetIndex = dataParams.length + 1;
    dataParams.push(offset);

    // Consulta principal
    const dataSql = `
      SELECT DISTINCT ON (f.id)
        f.id,
        f.codigo,
        f.nombre,
        f.nombre_corto,
        (
          SELECT ARRAY_AGG(cf4.campus_id)
          FROM infraestructura.campus_facultades cf4
          WHERE cf4.facultad_id = f.id AND cf4.activo = true
        ) AS campus_ids,
        (
          SELECT JSON_AGG(
            JSON_BUILD_OBJECT('id', c5.id, 'nombre', c5.nombre)
            ORDER BY c5.nombre
          )
          FROM infraestructura.campus_facultades cf5
          JOIN infraestructura.campus c5 ON c5.id = cf5.campus_id
          WHERE cf5.facultad_id = f.id AND cf5.activo = true
        ) AS campuses_json,
        f.activo,
        f.creado_en
      FROM infraestructura.facultades f
      LEFT JOIN infraestructura.campus_facultades cf ON cf.facultad_id = f.id AND cf.activo = true
      LEFT JOIN infraestructura.campus c ON c.id = cf.campus_id
      ${whereSql}
      ORDER BY f.id, ${orderByMap[opts.orderBy]} ${opts.orderDir.toUpperCase()}
      LIMIT $${limitIndex}
      OFFSET $${offsetIndex}
    `;

    // Consulta paginada
    const rows: Array<{
      id: number;
      codigo: string;
      nombre: string;
      nombre_corto: string | null;
      activo: boolean;
      creado_en: string | Date;
      campus_ids: number[] | null;
      campuses_json: Array<{ id: number; nombre: string }> | null;
    }> = await this.dataSource.query(dataSql, dataParams);

    const items = rows.map((row) => ({
      id: Number(row.id),
      codigo: row.codigo,
      nombre: row.nombre,
      nombre_corto: row.nombre_corto,
      campus_ids: row.campus_ids ?? [],
      campuses: row.campuses_json ?? [],
      activo: row.activo,
      creado_en: new Date(row.creado_en).toISOString(),
    }));

    // Calculamos si existe siguiente pagina
    const hasNextPage = opts.page * opts.take < total;

    // hay pagina anterior
    const hasPreviousPage = opts.page > 1;

    return {
      items,
      meta: {
        total,
        page: opts.page,
        take: opts.take,
        hasNextPage,
        hasPreviousPage,
      },
    };
  }

  async update(
    id: number,
    input: UpdateFacultadesInput,
  ): Promise<{ id: number }> {
    const sets: string[] = [];
    const params: any[] = [];
    let i = 1;

    if (input.codigo !== undefined) {
      sets.push(`codigo = $${i++}`);
      params.push(input.codigo);
    }

    if (input.nombre !== undefined) {
      sets.push(`nombre = $${i++}`);
      params.push(input.nombre);
    }

    if (input.nombre_corto !== undefined) {
      sets.push(`nombre_corto = $${i++}`);
      params.push(input.nombre_corto);
    }

    if (input.activo !== undefined) {
      sets.push(`activo = $${i++}`);
      params.push(input.activo);
    }

    // Si no hay nada que actualizar, no ejecutamos
    if (sets.length === 0) {
      return { id };
    }

    const sql = `
      UPDATE infraestructura.facultades
      SET ${sets.join(', ')}
      WHERE id = $${i}
      RETURNING id
    `;
    params.push(id);

    await this.dataSource.query(sql, params);

    // Actualizar relaciones campus_facultades si se proporciona (sync logic)
    if (input.campus_ids !== undefined) {
      // Obtener relaciones actuales ACTIVAS
      const currentRelations = await this.dataSource.query<
        Array<{ campus_id: number }>
      >(
        'SELECT campus_id FROM infraestructura.campus_facultades WHERE facultad_id = $1 AND activo = true',
        [id],
      );
      let currentCampusIds = currentRelations.map(
        (r: { campus_id: number }) => r.campus_id,
      );

      const newCampusIds = input.campus_ids;

      // Identificar relaciones a eliminar (están en BD pero no en el nuevo array)
      const toRemove = currentCampusIds.filter(
        (c: number) => !newCampusIds.includes(c),
      );

      // Eliminar relaciones que ya no están (delete físico)
      if (toRemove.length > 0) {
        // Para cada relación a eliminar, verificar que no tenga bloques dependientes
        for (const campusId of toRemove) {
          const relToCheck = await this.dataSource.query<Array<{ id: number }>>(
            `SELECT id FROM infraestructura.campus_facultades 
             WHERE facultad_id = $1 AND campus_id = $2`,
            [id, campusId],
          );

          if (relToCheck.length > 0) {
            const campusFacultadId = relToCheck[0].id;

            // Verificar si hay bloques que dependen de esta relación
            const bloquesDependientes = await this.dataSource.query<Array<{ id: number; codigo: string; nombre: string }>>(
              `SELECT id, codigo, nombre FROM infraestructura.bloques 
               WHERE campus_facultad_id = $1 AND activo = true`,
              [campusFacultadId],
            );

            if (bloquesDependientes.length > 0) {
              throw new BadRequestException({
                error: 'CONFLICT_ERROR',
                message: 'No se puede eliminar la relación con el campus porque existen bloques activos que dependen de ella',
                details: bloquesDependientes.map((b) => ({
                  field: 'campus_ids',
                  message: `Bloque "${b.nombre}" (${b.codigo}) depende de esta relación`,
                })),
              });
            }
          }
        }

        // Eliminar físicamente las relaciones
        await this.dataSource.query(
          'DELETE FROM infraestructura.campus_facultades WHERE facultad_id = $1 AND campus_id = ANY($2)',
          [id, toRemove],
        );
      }

      // Identificar relaciones a crear (están en el nuevo array pero no en las relaciones ACTIVAS actuales)
      const toAdd = newCampusIds.filter(
        (c: number) => !currentCampusIds.includes(c),
      );

      // Crear nuevas relaciones o reactivar existentes
      if (toAdd.length > 0) {
        for (const campusId of toAdd) {
          const existingRel = await this.dataSource.query<Array<{ id: number; activo: boolean }>>(
            `SELECT id, activo FROM infraestructura.campus_facultades 
             WHERE facultad_id = $1 AND campus_id = $2`,
            [id, campusId],
          );

          if (existingRel.length > 0) {
            if (!existingRel[0].activo) {
              await this.dataSource.query(
                `UPDATE infraestructura.campus_facultades SET activo = true 
                 WHERE facultad_id = $1 AND campus_id = $2`,
                [id, campusId],
              );
            }
          } else {
            await this.dataSource.query(
              `INSERT INTO infraestructura.campus_facultades (campus_id, facultad_id) VALUES ($1, $2)`,
              [campusId, id],
            );
          }
        }
      }
    }

    return { id };
  }

  async findCampusById(campusId: number): Promise<{ id: number } | null> {
    const rows = await this.dataSource.query<Array<{ id: number }>>(
      `SELECT id FROM infraestructura.campus WHERE id = $1 AND activo = true`,
      [campusId],
    );
    return rows.length > 0 ? { id: rows[0].id } : null;
  }

  async findCampusFacultadRelationship(
    facultadId: number,
    campusId: number,
  ): Promise<{ id: number } | null> {
    const rows = await this.dataSource.query<Array<{ id: number }>>(
      `SELECT id FROM infraestructura.campus_facultades
       WHERE facultad_id = $1 AND campus_id = $2`,
      [facultadId, campusId],
    );
    return rows.length > 0 ? { id: rows[0].id } : null;
  }

  async findBlocksByCampusFacultadId(campus_facultadId: number): Promise<RelatedBlock[]> {
    const sql = `
      SELECT
        b.id,
        b.codigo,
        b.nombre,
        b.nombre_corto,
        b.activo,
        c.nombre AS campus_nombre
      FROM infraestructura.bloques b
      INNER JOIN infraestructura.campus_facultades cf ON cf.id = b.campus_facultad_id
      INNER JOIN infraestructura.campus c ON c.id = cf.campus_id
      WHERE cf.id = $1
    `;
    const rows = await this.dataSource.query<RelatedBlock[]>(sql, [campus_facultadId]);
    return rows;
  }

  async deleteRelationship(facultadId: number, campusId: number): Promise<{ id: number }> {
    await this.dataSource.query(
      `DELETE FROM infraestructura.campus_facultades WHERE facultad_id = $1 AND campus_id = $2`,
      [facultadId, campusId],
    );
    return { id: facultadId };
  }

  async hasOtherRelationships(facultadId: number, excludeCampusId: number): Promise<boolean> {
    const rows = await this.dataSource.query<Array<{ count: string }>>(
      `SELECT COUNT(*) as count
       FROM infraestructura.campus_facultades
       WHERE facultad_id = $1 AND campus_id != $2`,
      [facultadId, excludeCampusId],
    );
    const count = parseInt(rows[0]?.count ?? '0', 10);
    return count > 0;
  }

  async deleteFacultad(facultadId: number): Promise<{ id: number }> {
    await this.dataSource.query(
      `DELETE FROM infraestructura.facultades WHERE id = $1`,
      [facultadId],
    );
    return { id: facultadId };
  }
}
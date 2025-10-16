import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  CreateFacultadData,
  FacultadRepositoryPort,
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

  async isCodeTaken(codigo: string): Promise<boolean> {
    const sql = `
      SELECT 1
      FROM infraestructura.facultades
      WHERE codigo = $1
      LIMIT 1
    `;

    const rows: [] = await this.dataSource.query(sql, [codigo]);
    return rows.length > 0;
  }

  async create(data: CreateFacultadData): Promise<{ id: number }> {
    const sql = `
      INSERT INTO infraestructura.facultades (codigo, nombre, nombre_corto, coordenadas, campus_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;

    const params = [
      data.codigo,
      data.nombre,
      data.nombre_corto,
      data.pointLiteral,
      data.campus_id,
    ];

    const rows: Array<{ id: string }> = await this.dataSource.query(
      sql,
      params,
    );

    const [row] = rows;

    return { id: Number(row.id) };
  }

  async findById(id: number): Promise<facultadCompleta | null> {
    const sql = `
    SELECT
      f.id,
      f.codigo,
      f.nombre,
      f.nombre_corto,
      f.coordenadas[1]::float8 AS lat,
      f.coordenadas[0]::float8 AS lng,
      f.activo,
    FROM infraestructura.facultades f
    WHERE f.id = $1
    LIMIT 1
    `;

    const row = await this.dataSource.query<facultadCompleta[]>(sql, [id]);
    if (row.length === 0) {
      return null;
    }

    return row[0];
  }

  async findPaginated(
    opts: ListFacultadesQuery,
  ): Promise<ListFacultadesResult> {
    //Cantidad de registros que debemos saltar antes de empezar a mostrar resultados
    const offset = (opts.page - 1) * opts.take;

    const filterParams: Array<string | number> = [];

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
        `(f.codigo ILIKE $${codigoIndex} OR f.nombre ILIKE $${nombreIndex} OR c.nombre ILIKE $${campusIndex})`,
      );
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

    //Construccion de la consulta
    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM infraestructura.facultades f
      JOIN infraestructura.campus c ON c.id = f.campus_id
      ${whereSql}
    `;

    // Ejecucion de la consulta de conteo
    const countRows: Array<{ total: number }> = await this.dataSource.query(
      countSql,
      filterParams,
    );

    //Extraccion de todo, si esta vaico asumimos 0
    const total = countRows[0]?.total ?? 0;

    //Copiamos los parametros de filtro para reutilizarlos en la consulta principal
    const dataParams = [...filterParams];
    //Calculamos el indice que ocupara LIMIT
    const limitIndex = dataParams.length + 1;
    dataParams.push(opts.take);

    //Calculamos el indice que tomara el offset
    const offsetIndex = dataParams.length + 1;
    dataParams.push(offset);

    //Consulta principal
    const dataSql = `
      SELECT
        f.id,
        f.codigo,
        f.nombre,
        f.nombre_corto,
        c.nombre AS campus_nombre,
        f.activo,
        f.creado_en
      FROM infraestructura.facultades f
      JOIN infraestructura.campus c ON c.id = f.campus_id
      ${whereSql}
      ORDER BY ${orderByMap[opts.orderBy]} ${opts.orderDir.toUpperCase()}
      LIMIT $${limitIndex}
      OFFSET $${offsetIndex}
    `;

    // Consulta paginada
    const rows: Array<{
      id: number;
      codigo: string;
      nombre: string;
      nombre_corto: string | null;
      campus_nombre: string;
      activo: boolean;
      creado_en: string | Date;
    }> = await this.dataSource.query(dataSql, dataParams);

    const items = rows.map((row) => ({
      id: Number(row.id),
      codigo: row.codigo,
      nombre: row.nombre,
      nombre_corto: row.nombre_corto,
      campus_nombre: row.campus_nombre,
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

  update(id: number, input: UpdateFacultadesInput): Promise<{ id: number }> {
    throw new Error('Sin implementar');
  }
}

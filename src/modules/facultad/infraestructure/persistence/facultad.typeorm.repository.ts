import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  CreateFacultadData,
  FacultadRepositoryPort,
} from '../../domain/facultad.repository.port';

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
      VALUES ($1, $2, $3, point($4), $5)
      RETURNING id
    `;

    const params = [
      data.codigo,
      data.nombre,
      data.nombre_corto,
      data.pointLiteral,
      data.campus_id,
    ];

    const row = await this.dataSource.query<{
      id: number;
    }>(sql, params);

    return { id: Number(row.id) };
  }
}

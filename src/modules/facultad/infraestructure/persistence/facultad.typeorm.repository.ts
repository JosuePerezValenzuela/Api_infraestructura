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
}

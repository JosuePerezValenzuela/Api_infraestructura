import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CampusRepositoryPort } from '../domain/campus.repository.port';
import { CampusOrmEntity } from './campus.orm-entity';

type OrderBy = { column: string; direction: 'asc' | 'desc' };
type ListOptions = {
  skip: number;
  take: number;
  search?: string;
  orderBy: OrderBy;
};

export class TypeormCampusRepository implements CampusRepositoryPort {
  constructor(
    @InjectRepository(CampusOrmEntity)
    private readonly repo: Repository<CampusOrmEntity>,
  ) {}

  async create(input: {
    nombre: string;
    direccion: string;
    lat: number;
    lng: number;
  }): Promise<{ id: number }> {
    const pointAsText = `(${input.lng},${input.lat})`;
    const entity = this.repo.create({
      nombre: input.nombre,
      direccion: input.direccion,
      coordenadas: pointAsText,
    });

    const saved = await this.repo.save(entity);
    return { id: saved.id };
  }

  async list(opts: ListOptions) {
    const { skip, take, search, orderBy } = opts;

    let qb = this.repo
      .createQueryBuilder('c')
      .select([
        'c.id AS id',
        'c.nombre AS nombre',
        'c.direccion AS direccion',
        'c.coordenadas[1]::float8 AS lat',
        'c.coordenadas[0]::float8 AS lng',
        'c.activo AS activo',
        'c.creado_en AS creado_en',
        'c.actualizado_en AS actualizado_en',
      ]);

    if (search && search.trim() != '') {
      qb = qb.where('(c.nombre ILIKE :q OR c.direccion ILIKE :q)', {
        q: `%${search}%`,
      });
    }

    qb = qb
      .orderBy(
        orderBy.column,
        orderBy.direction.toUpperCase() as 'ASC' | 'DESC',
      )
      .skip(skip)
      .take(take);

    const [items, totalRow] = await Promise.all([
      qb.getRawMany<{
        id: number;
        nombre: string;
        direccion: string;
        lat: number;
        lng: number;
        activo: boolean;
        creado_en: Date;
        actualizado_en: Date;
      }>(),
      (async () => {
        let cqd = this.repo.createQueryBuilder('c').select('COUNT(*)', 'cnt');
        if (search && search.trim() !== '') {
          cqd = cqd.where('(c.nombre ILIKE :q OR c.direccion ILIKE :q)', {
            q: `%${search}%`,
          });
        }
        const { cnt } = (await cqd.getRawOne<{ cnt: string }>()) ?? {
          cnt: '0',
        };
        return Number(cnt) || 0;
      })(),
    ]);

    return { items, total: totalRow };
  }
}

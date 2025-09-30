import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import {
  CampusListItem,
  CampusRepositoryPort,
  ListOptions,
} from '../domain/campus.repository.port';
import { CampusOrmEntity } from './campus.orm-entity';

type PgDriverError = { code?: string; constraint?: string; detail?: string };

export class TypeormCampusRepository implements CampusRepositoryPort {
  constructor(
    @InjectRepository(CampusOrmEntity)
    private readonly repo: Repository<CampusOrmEntity>,
  ) {}

  async create(input: {
    nombre: string;
    codigo: string;
    direccion: string;
    lat: number;
    lng: number;
  }): Promise<{ id: number }> {
    try {
      const pointAsText = `(${input.lng},${input.lat})`;
      const entity = this.repo.create({
        nombre: input.nombre,
        codigo: input.codigo,
        direccion: input.direccion,
        coordenadas: pointAsText,
      });

      const saved = await this.repo.save(entity);
      return { id: saved.id };
    } catch (err: unknown) {
      if (err instanceof QueryFailedError) {
        const drv = (err as QueryFailedError).driverError as
          | PgDriverError
          | undefined;
        if (drv?.code === '23505') {
          throw new Error('Ya existe un campus con el mismo código');
        }
      }
      throw err;
    }
  }

  async list(
    opts: ListOptions,
  ): Promise<{ items: CampusListItem[]; total: number }> {
    const {
      skip,
      take,
      search,
      orderBy = 'creado_en',
      direction = 'asc',
    } = opts;

    const ORDER_COLUMNS: Record<'nombre' | 'creado_en', string> = {
      nombre: 'c.nombre',
      creado_en: 'c.creado_en',
    };

    const dir = direction.toUpperCase() as 'ASC' | 'DESC';
    const orderCol = ORDER_COLUMNS[orderBy];

    let qb = this.repo
      .createQueryBuilder('c')
      .select([
        'c.id AS id',
        'c.codigo as codigo',
        'c.nombre AS nombre',
        'c.direccion AS direccion',
        'c.coordenadas[1]::float8 AS lat',
        'c.coordenadas[0]::float8 AS lng',
        'c.activo AS activo',
        'c.creado_en AS creado_en',
        'c.actualizado_en AS actualizado_en',
      ]);

    if (search && search.trim() != '') {
      qb = qb.where(
        '(c.nombre ILIKE :q OR c.direccion ILIKE :q OR c.codigo ILIKE :q)',
        {
          q: `%${search}%`,
        },
      );
    }

    qb = qb.orderBy(orderCol, dir).skip(skip).take(take);

    const [items, total] = await Promise.all([
      qb.getRawMany<CampusListItem>(),
      (async () => {
        let countQb = this.repo
          .createQueryBuilder('c')
          .select('COUNT(*)', 'cnt');
        if (search && search.trim() != '') {
          countQb = countQb.where(
            '(c.nombre ILIKE :q OR c.direccion ILIKE :q OR c.codigo ILIKE :q)',
            { q: `%${search}%` },
          );
        }
        const { cnt } = (await countQb.getRawOne<{ cnt: string }>()) ?? {
          cnt: '0',
        };
        return Number(cnt) || 0;
      })(),
    ]);
    return { items, total };
  }
}

import { Inject, Injectable } from '@nestjs/common';
import { CampusRepositoryPort } from '../domain/campus.repository.port';

export type ListCampusInput = {
  skip?: number;
  take?: number;
  search?: string;
  orderBy?: 'nombre' | 'creado_en';
  direction?: 'asc' | 'desc';
};

@Injectable()
export class ListCampusUseCase {
  constructor(
    @Inject(CampusRepositoryPort) private readonly repo: CampusRepositoryPort,
  ) {}

  async execute(input: ListCampusInput) {
    const {
      skip = 0,
      take = 10,
      search,
      orderBy = 'creado_en',
      direction = 'asc',
    } = input;

    const { items, total } = await this.repo.list({
      skip,
      take,
      search,
      orderBy,
      direction,
    });

    const page = Math.floor(skip / take) + 1;
    const pages = Math.max(1, Math.ceil(total / take));

    return {
      items,
      meta: {
        total,
        page,
        take,
        pages,
        hasNextpage: page < pages,
        hasPrevPage: page > 1,
      },
    };
  }
}

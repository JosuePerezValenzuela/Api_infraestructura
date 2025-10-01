export type OrderDirection = 'asc' | 'desc';
export interface ListOptions {
  skip: number;
  take: number;
  search?: string;
  orderBy?: 'nombre' | 'creado_en';
  direction?: OrderDirection;
}

export interface CampusListItem {
  id: number;
  codigo: string;
  nombre: string;
  direccion: string;
  lat: number;
  lng: number;
  activo: boolean;
  creado_en: Date;
  actualizado_en: Date;
}

export interface UpdateCampusInput {
  codigo?: string;
  nombre?: string;
  direccion?: string;
  lat?: number;
  lng?: number;
  activo?: boolean;
}

export const CampusRepositoryPort = Symbol('CampusRepositoryPort');
export interface CampusRepositoryPort {
  create(input: {
    nombre: string;
    codigo: string;
    direccion: string;
    lat: number;
    lng: number;
  }): Promise<{ id: number }>;

  list(opts: ListOptions): Promise<{
    items: CampusListItem[];
    total: number;
  }>;

  update(id: number, input: UpdateCampusInput): Promise<boolean>;
}
//Los dominios definen lo que necesita un 'puerto'

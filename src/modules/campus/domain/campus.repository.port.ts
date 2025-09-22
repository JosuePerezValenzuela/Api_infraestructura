export const CampusRepositoryPort = Symbol('CampusRepositoryPort');

export interface CampusRepositoryPort {
  create(input: {
    nombre: string;
    direccion: string;
    lat: number;
    lng: number;
  }): Promise<{ id: number }>;
}
//Los dominios definen lo que necesita un 'puerto'

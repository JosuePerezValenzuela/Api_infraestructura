export class CreateFacultadCommand {
  readonly codigo: string;
  readonly nombre: string;
  readonly nombre_corto: string | null;
  readonly lat: number;
  readonly lng: number;
  readonly campus_id: number;

  constructor(params: {
    codigo: string;
    nombre: string;
    nombre_corto: string | null;
    lat: number;
    lng: number;
    campus_id: number;
  }) {
    this.codigo = params.codigo;
    this.nombre = params.nombre;
    this.nombre_corto = params.nombre_corto;
    this.lat = params.lat;
    this.lng = params.lng;
    this.campus_id = params.campus_id;
  }
}

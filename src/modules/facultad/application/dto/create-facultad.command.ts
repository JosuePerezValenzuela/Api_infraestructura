export class CreateFacultadCommand {
  readonly codigo: string;
  readonly nombre: string;
  readonly nombre_corto: string | null;
  readonly campus_ids: number[];

  constructor(params: {
    codigo: string;
    nombre: string;
    nombre_corto: string | null;
    campus_ids: number[];
  }) {
    this.codigo = params.codigo;
    this.nombre = params.nombre;
    this.nombre_corto = params.nombre_corto;
    this.campus_ids = params.campus_ids;
  }
}
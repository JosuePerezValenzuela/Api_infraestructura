export interface CreateTipoAmbienteCommand {
  nombre: string;
  descripcion: string;
  descripcion_corta?: string;
  activo: boolean;
}

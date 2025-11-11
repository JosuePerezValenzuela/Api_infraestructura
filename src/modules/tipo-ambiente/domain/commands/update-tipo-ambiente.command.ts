export interface UpdateTipoAmbienteCommand {
  id: number;
  nombre?: string;
  descripcion?: string;
  descripcion_corta?: string | null;
  activo?: boolean;
}

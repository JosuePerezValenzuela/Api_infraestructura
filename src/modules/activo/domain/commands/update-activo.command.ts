export interface UpdateActivoCommand {
  id: number;
  nia?: string;
  nombre?: string;
  descripcion?: string | null;
  ambiente_id?: number | null;
}

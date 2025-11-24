export interface CreateActivoCommand {
  nia: string;
  nombre: string;
  descripcion?: string;
  ambiente_id?: number | null;
}

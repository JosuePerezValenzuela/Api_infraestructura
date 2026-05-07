export interface UpdateBloqueCommand {
  id: number;
  codigo?: string;
  nombre?: string;
  nombre_corto?: string | null;
  pisos?: number;
  coordinates?: {
    pointLiteral: string;
  };
  activo?: boolean;
  campus_facultad_id?: number;
  tipo_bloque_id?: number;
}

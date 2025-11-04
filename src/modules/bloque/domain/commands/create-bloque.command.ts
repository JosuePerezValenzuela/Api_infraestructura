// Los datos minimos que necesita la capa de infraestructura para crear un bloque

export interface CreateBloqueCommand {
  codigo: string;
  nombre: string;
  nombre_corto: string | null;
  pointLiteral: string;
  pisos: number;
  activo: boolean;
  facultad_id: number;
  tipo_bloque_id: number;
}

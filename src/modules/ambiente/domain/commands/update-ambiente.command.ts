// Comando para actualizar parcialmente un ambiente
export interface UpdateAmbienteCommand {
  id: number;
  codigo?: string;
  nombre?: string;
  nombre_corto?: string | null;
  piso?: number;
  capacidad?: {
    total: number;
    examen: number;
  };
  dimension?: {
    largo: number;
    ancho: number;
    alto: number;
    unid_med: 'metros' | 'centimetros' | 'milimetros';
  };
  clases?: boolean;
  activo?: boolean;
  tipo_ambiente_id?: number;
  bloque_id?: number;
}

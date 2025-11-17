// Este comando define la forma exacta en la que enviaremos los datos a la capa de infraestructura para crear un ambiente.
export interface CreateAmbienteCommand {
  nombre: string;
  nombre_corto: string | null;
  codigo: string;
  piso: number;
  capacidad: {
    total: number;
    examen: number;
  };
  dimension: {
    largo: number;
    ancho: number;
    alto: number;
    unid_med: 'metros';
  };
  clases: boolean;
  activo: boolean;
  tipo_ambiente_id: number;
  bloque_id: number;
}

import { DisponibilidadMatrizFila } from '../models/disponibilidad-matriz';

// View-model agregado que representa toda la informacion necesaria para el reporte.
export interface AmbienteDetalleViewModel {
  ambiente: {
    id: number;
    codigo: string;
    nombre: string;
    nombre_corto?: string | null;
    piso: number;
    clases: boolean;
    activo: boolean;
    capacidad: { total: number; examen: number };
    dimension: { largo: number; ancho: number; alto: number; unid_med: string };
    hora_apertura: string | null;
    hora_cierre: string | null;
    periodo: number | null;
    creado_en: string;
    actualizado_en: string;
  };
  bloque: {
    id: number;
    codigo: string;
    nombre: string;
    tipo_bloque: { id: number; nombre: string };
  };
  facultad: {
    id: number;
    codigo: string;
    nombre: string;
    nombre_corto?: string | null;
  };
  campus: {
    id: number;
    codigo: string;
    nombre: string;
  };
  tipo_ambiente: { id: number; nombre: string };
  horarios: Array<{ dia: number; hora_inicio: string; hora_fin: string }>;
  activos: Array<{ nia: string; nombre: string; descripcion?: string | null }>;
  disponibilidadMatriz: DisponibilidadMatrizFila[];
}

export abstract class AmbienteReporteRepository {
  abstract obtenerPorCodigo(
    codigo: string,
  ): Promise<AmbienteDetalleViewModel | null>;
}

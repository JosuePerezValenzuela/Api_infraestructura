export type EstadoEntidad = 'activo' | 'inactivo';

export interface CapacidadResumen {
  total: number;
  examen: number;
}

export interface KpiResumen {
  total_facultades?: number;
  facultades_activas?: number;
  facultades_inactivas?: number;
  total_bloques?: number;
  bloques_activos?: number;
  bloques_inactivos?: number;
  total_tipos_bloque?: number;
  tipos_bloque?: Record<string, number>;
  total_ambientes?: number;
  ambientes_activos?: number;
  ambientes_inactivos?: number;
  total_tipos_ambiente?: number;
  tipos_ambiente?: Record<string, number>;
  capacidad?: CapacidadResumen;
  activos_asociados?: number;
}

export interface AmbienteView {
  id: string;
  codigo: string;
  nombre: string;
  piso: string;
  tipo_ambiente: string;
  capacidad: CapacidadResumen;
  dimensiones?: string;
  clases?: string;
  estado: EstadoEntidad;
  activos_count: number;
}

export interface BloqueView {
  id: string;
  codigo: string;
  nombre: string;
  tipo_bloque: string;
  pisos: number;
  estado: EstadoEntidad;
  kpis: KpiResumen;
  ambientes: AmbienteView[];
}

export interface FacultadView {
  id: string;
  codigo: string;
  nombre: string;
  estado: EstadoEntidad;
  kpis: KpiResumen;
  bloques: BloqueView[];
}

export interface CampusView {
  id: string;
  codigo: string;
  nombre: string;
  direccion: string;
  estado: EstadoEntidad;
  kpis: KpiResumen;
  facultades: FacultadView[];
}

export interface InventarioReporteViewModel {
  scope: 'campus' | 'facultad' | 'bloque';
  campus?: CampusView;
  facultad?: FacultadView;
  bloque?: BloqueView;
}

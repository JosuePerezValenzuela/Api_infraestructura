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
  id: number; // antes string
  codigo: string;
  nombre: string;
  piso: number; // antes string, en BD es smallint
  tipo_ambiente: string;
  capacidad: CapacidadResumen;
  // aquí puedes decidir si quieres algo estructurado o solo texto
  dimensiones?: string; // p.ej. "10 x 8 x 3 m"
  clases?: boolean; // en BD es boolean; si prefieres texto "Sí/No", déjalo como string
  estado: EstadoEntidad;
  activos_count: number;
}

export interface BloqueView {
  id: number; // antes string
  codigo: string;
  nombre: string;
  tipo_bloque: string;
  pisos: number;
  estado: EstadoEntidad;
  kpis: KpiResumen;
  ambientes: AmbienteView[];
}

export interface FacultadView {
  id: number; // antes string
  codigo: string;
  nombre: string;
  estado: EstadoEntidad;
  kpis: KpiResumen;
  bloques: BloqueView[];
}

export interface CampusView {
  id: number; // antes string
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

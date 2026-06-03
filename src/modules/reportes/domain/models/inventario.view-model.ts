export type KpiResumen = {
  // Campus level
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
  capacidad?: { total: number; examen: number };
  activos_asociados?: number;
};

export type AmbienteView = {
  id: number;
  codigo: string;
  nombre: string;
  piso: number;
  tipo_ambiente: string;
  capacidad: { total: number; examen: number };
  dimensiones?: string;
  clases: boolean;
  estado: 'activo' | 'inactivo';
  activos_count: number;
};

export type BloqueView = {
  id: number;
  codigo: string;
  nombre: string;
  tipo_bloque: string;
  pisos: number;
  estado: 'activo' | 'inactivo';
  kpis: KpiResumen;
  ambientes: AmbienteView[];
};

export type FacultadView = {
  id: number;
  codigo: string;
  nombre: string;
  estado: 'activo' | 'inactivo';
  kpis: KpiResumen;
  bloques: BloqueView[];
};

export type CampusView = {
  id: number;
  codigo: string;
  nombre: string;
  direccion: string;
  estado: 'activo' | 'inactivo';
  kpis: KpiResumen;
  facultades: FacultadView[];
};

export type InventarioReporteViewModel =
  | { scope: 'campus'; campus: CampusView; facultad?: never; bloque?: never }
  | {
      scope: 'facultad';
      facultad: FacultadView;
      campus?: never;
      bloque?: never;
    }
  | { scope: 'bloque'; bloque: BloqueView; campus?: never; facultad?: never };

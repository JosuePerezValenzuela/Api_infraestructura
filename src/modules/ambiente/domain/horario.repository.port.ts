export interface HorarioOperacionItem {
  dia: number;
  nombre_dia: string;
  apertura: string;
  cierre: string;
  periodo: number;
}

export interface HorarioSlot {
  dia: number;
  hora_inicio: string;
  hora_fin: string;
}

export interface ReplaceHorariosCommand {
  ambiente_id: number;
  franjas: HorarioSlot[];
}

export interface ReplaceHorariosResult {
  ambiente_id: number;
  total: number;
}

export const HorarioRepositoryPort = Symbol('HorarioRepositoryPort');

export interface HorarioRepositoryPort {
  findByAmbienteId(ambienteId: number): Promise<HorarioOperacionItem[]>;
  replaceForAmbiente(
    command: ReplaceHorariosCommand,
  ): Promise<ReplaceHorariosResult>;
  listByAmbiente(ambiente_id: number): Promise<HorarioSlot[]>;
  deleteByAmbienteId(ambienteId: number): Promise<void>;
}

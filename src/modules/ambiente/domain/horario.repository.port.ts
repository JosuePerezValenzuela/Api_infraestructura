export type HorarioDia = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface HorarioSlot {
  dia: HorarioDia;
  hora_inicio: string; // Formato HH:mm
  hora_fin: string; // Formato HH:mm
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
  replaceForAmbiente(
    command: ReplaceHorariosCommand,
  ): Promise<ReplaceHorariosResult>;

  listByAmbiente(ambiente_id: number): Promise<HorarioSlot[]>;
}

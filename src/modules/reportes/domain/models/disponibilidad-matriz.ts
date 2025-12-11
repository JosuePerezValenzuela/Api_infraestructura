/* eslint-disable indent */
// Representa una fila de la matriz de disponibilidad (hora + flags de cada dia).
export interface DisponibilidadMatrizFila {
  hora: string;
  lunes: boolean;
  martes: boolean;
  miercoles: boolean;
  jueves: boolean;
  viernes: boolean;
  sabado: boolean;
  domingo: boolean;
}

// Entrada necesaria para construir la matriz desde las franjas horarias y el periodo.
export interface BuildDisponibilidadInput {
  horaApertura: string; // formato HH:MM
  horaCierre: string; // formato HH:MM
  periodo: number; // minutos
  franjas: Array<{
    dia: number; // 0 = lunes ... 6 = domingo
    hora_inicio: string; // HH:MM
    hora_fin: string; // HH:MM
  }>;
}

/**
 * Construye una matriz Horas vs dias (lunes-domingo) marcando true cuando el ambiente
 * esta disponible dentro de las franjas. Intervalos tratados como [inicio, fin).
 */
export function buildDisponibilidadMatriz(
  input: BuildDisponibilidadInput,
): DisponibilidadMatrizFila[] {
  const { horaApertura, horaCierre, periodo, franjas } = input;

  // Convierte "HH:MM" a minutos desde las 00:00 para operar aritmeticamente.
  const toMinutes = (hhmm: string): number => {
    const [hh, mm] = hhmm.split(':').map((v) => Number(v));
    return hh * 60 + mm;
  };

  // Genera el listado de marcas de tiempo desde apertura hasta antes del cierre.
  const start = toMinutes(horaApertura);
  const end = toMinutes(horaCierre);

  const slots: number[] = [];
  for (let t = start; t < end; t += periodo) {
    slots.push(t);
  }

  // Normaliza franjas a intervalos numéricos para comparación rápida.
  const franjasNum = franjas.map((f) => ({
    dia: f.dia,
    ini: toMinutes(f.hora_inicio),
    fin: toMinutes(f.hora_fin),
  }));

  const padTime = (minutes: number): string => {
    const hh = Math.floor(minutes / 60)
      .toString()
      .padStart(2, '0');
    const mm = (minutes % 60).toString().padStart(2, '0');
    return `${hh}:${mm}`;
  };

  return slots.map<DisponibilidadMatrizFila>((slot) => {
    // Intervalo tratado como [slot, slot+periodo)
    const fila: DisponibilidadMatrizFila = {
      hora: padTime(slot),
      lunes: false,
      martes: false,
      miercoles: false,
      jueves: false,
      viernes: false,
      sabado: false,
      domingo: false,
    };

    franjasNum.forEach((f) => {
      const overlaps = slot >= f.ini && slot < f.fin;
      if (!overlaps) return;
      switch (f.dia) {
        case 0:
          fila.lunes = true;
          break;
        case 1:
          fila.martes = true;
          break;
        case 2:
          fila.miercoles = true;
          break;
        case 3:
          fila.jueves = true;
          break;
        case 4:
          fila.viernes = true;
          break;
        case 5:
          fila.sabado = true;
          break;
        case 6:
          fila.domingo = true;
          break;
        default:
          break;
      }
    });

    return fila;
  });
}

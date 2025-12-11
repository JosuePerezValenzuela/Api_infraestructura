import {
  buildDisponibilidadMatriz,
  DisponibilidadMatrizFila,
} from './disponibilidad-matriz';

describe('buildDisponibilidadMatriz', () => {
  it('marca las celdas correctas segun franjas y periodo', () => {
    // Definimos horario operativo: de 08:00 a 10:00 con saltos de 30 minutos.
    const horaApertura = '08:00';
    const horaCierre = '10:00';
    const periodo = 30;
    // Dos franjas: lunes 08:00-09:00 y martes 08:30-10:00.
    const franjas = [
      { dia: 0, hora_inicio: '08:00', hora_fin: '09:00' },
      { dia: 1, hora_inicio: '08:30', hora_fin: '10:00' },
    ];
    const matriz = buildDisponibilidadMatriz({
      horaApertura,
      horaCierre,
      periodo,
      franjas,
    });

    // Esperamos cuatro filas: 08:00, 08:30, 09:00, 09:30 (hasta antes de 10:00).
    expect(matriz).toHaveLength(4);
    // 08:00: solo lunes activo.
    expect(matriz[0]).toEqual<DisponibilidadMatrizFila>({
      hora: '08:00',
      lunes: true,
      martes: false,
      miercoles: false,
      jueves: false,
      viernes: false,
      sabado: false,
      domingo: false,
    });
    // 08:30: lunes sigue, martes inicia.
    expect(matriz[1]).toMatchObject({
      hora: '08:30',
      lunes: true,
      martes: true,
    });
    // 09:00: lunes termina (09:00 es excluyente), martes sigue.
    expect(matriz[2]).toMatchObject({
      hora: '09:00',
      lunes: false,
      martes: true,
    });
    // 09:30: solo martes.
    expect(matriz[3]).toMatchObject({
      hora: '09:30',
      lunes: false,
      martes: true,
    });
  });

  it('genera matriz vacia cuando no hay franjas', () => {
    const matriz = buildDisponibilidadMatriz({
      horaApertura: '06:00',
      horaCierre: '07:00',
      periodo: 30,
      franjas: [],
    });
    // Aun sin franjas, debe generar las filas de tiempo, pero con todas las celdas en false.
    expect(matriz).toHaveLength(2);
    matriz.forEach((fila) => {
      expect(fila.lunes).toBe(false);
      expect(fila.martes).toBe(false);
      expect(fila.miercoles).toBe(false);
      expect(fila.jueves).toBe(false);
      expect(fila.viernes).toBe(false);
      expect(fila.sabado).toBe(false);
      expect(fila.domingo).toBe(false);
    });
  });
});

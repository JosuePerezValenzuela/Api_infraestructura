// Pruebas pedagogicas para el DTO de ambientes disponibles; cada linea explica que esta ocurriendo.

import { plainToInstance } from 'class-transformer'; // Convierte objetos planos al DTO para que se apliquen los decoradores.
import { validate } from 'class-validator'; // Ejecuta las validaciones declarativas del DTO.
import { ListAmbientesDisponiblesQueryDto } from './list-ambientes-disponibles-query.dto'; // DTO que vamos a poner a prueba.

// Funcion auxiliar para validar un payload y devolver solo las propiedades con errores.
const validateDto = async (payload: Record<string, unknown>) => {
  // Transformamos el objeto plano en una instancia del DTO para que class-validator lea los decoradores.
  const dto = plainToInstance(ListAmbientesDisponiblesQueryDto, payload);
  // Ejecutamos las validaciones declaradas en el DTO.
  const errors = await validate(dto);
  // Simplificamos la salida a { property, constraints } para facilitar los asserts.
  return errors.map((error) => ({
    property: error.property,
    constraints: error.constraints ?? {},
  }));
};

describe('ListAmbientesDisponiblesQueryDto', () => {
  it('acepta un payload valido con todos los filtros', async () => {
    // Construimos un payload con todos los campos bien formados.
    const payload = {
      capacidad_min: 10,
      capacidad_examen_min: 20,
      mismo_piso: true,
      tipo_ambiente_ids: [1, 2],
      campus_ids: [1],
      facultad_ids: [1],
      bloque_ids: [1],
      tipo_bloque_ids: [3],
      dia: 1,
      hora_inicio: '08:00',
      hora_fin: '10:00',
      page: 2,
      take: 5,
      orderBy: 'codigo',
      orderDir: 'desc',
    };
    // Validamos el DTO con el payload.
    const errors = await validateDto(payload);
    // Esperamos cero errores porque todo esta correcto.
    expect(errors).toHaveLength(0);
  });

  it('rechaza arrays vacios o con IDs no positivos', async () => {
    // Caso 1: array vacio debe fallar.
    const emptyErrors = await validateDto({ tipo_ambiente_ids: [] });
    // Confirmamos que hubo error en tipo_ambiente_ids.
    expect(emptyErrors.map((e) => e.property)).toContain('tipo_ambiente_ids');

    // Caso 2: array con valores invalidos (0 o negativos) debe fallar igual.
    const invalidErrors = await validateDto({ campus_ids: [0, -1] });
    // Confirmamos que la propiedad campus_ids fue marcada con error.
    expect(invalidErrors.map((e) => e.property)).toContain('campus_ids');
  });

  it('valida coherencia de horario (requiere dia y horas con formato y orden correctos)', async () => {
    // Caso con horas sin dia: debe fallar.
    const missingDay = await validateDto({
      hora_inicio: '08:00',
      hora_fin: '10:00',
    });
    // El error debe involucrar el campo dia.
    expect(missingDay.map((e) => e.property)).toContain('dia');

    // Caso con dia sin horas: debe fallar.
    const missingHours = await validateDto({ dia: 2 });
    // Debe senalar hora_inicio y hora_fin.
    const missingHoursProps = missingHours.map((e) => e.property);
    expect(missingHoursProps).toEqual(
      expect.arrayContaining(['hora_inicio', 'hora_fin']),
    );

    // Caso con formato u orden incorrecto: hora_inicio >= hora_fin debe fallar.
    const wrongOrder = await validateDto({
      dia: 1,
      hora_inicio: '10:00',
      hora_fin: '08:00',
    });
    // Esperamos un error asociado a la validacion custom de horario (se reflejara en hora_fin).
    expect(wrongOrder.map((e) => e.property)).toContain('hora_fin');
  });

  it('valida subconjuntos campus/facultad/bloque', async () => {
    // Enviamos facultad_ids que no pertenecen a campus_ids.
    const wrongCampus = await validateDto({
      campus_ids: [1],
      facultad_ids: [2],
    });
    // Debe marcar error en facultad_ids.
    expect(wrongCampus.map((e) => e.property)).toContain('facultad_ids');

    // Enviamos bloque_ids que no pertenecen a facultad_ids.
    const wrongFaculty = await validateDto({
      facultad_ids: [3],
      bloque_ids: [4],
    });
    // Debe marcar error en bloque_ids.
    expect(wrongFaculty.map((e) => e.property)).toContain('bloque_ids');
  });
});

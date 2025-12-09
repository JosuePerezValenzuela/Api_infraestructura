import { InventarioReporteRepository } from '../../domain/ports/inventario-reporte.repository';
import { InventarioReporteViewModel } from '../../domain/models/inventario.view-model';

// Nota: este test es más un contrato esperado del adapter; cuando implementemos con SQL crudo,
// deberíamos validar que se construye el view-model con KPIs agregadas y estructuras anidadas.

describe('InventarioReporteRepository (contrato esperado)', () => {
  it('debería exponer métodos por scope', () => {
    const repo: InventarioReporteRepository = {
      obtener_por_campus: jest.fn(),
      obtener_por_facultad: jest.fn(),
      obtener_por_bloque: jest.fn(),
    };
    expect(repo.obtener_por_campus).toBeDefined();
    expect(repo.obtener_por_facultad).toBeDefined();
    expect(repo.obtener_por_bloque).toBeDefined();
  });

  it('ejemplo de shape de view-model para campus', async () => {
    const mockRepo: InventarioReporteRepository = {
      obtener_por_campus: jest.fn().mockResolvedValue({
        scope: 'campus',
        campus: {
          id: 'campus-1',
          codigo: 'C1',
          nombre: 'Campus 1',
          direccion: 'Dir 1',
          estado: 'activo',
          kpis: {
            total_facultades: 1,
            facultades_activas: 1,
            facultades_inactivas: 0,
            total_bloques: 2,
            bloques_activos: 2,
            bloques_inactivos: 0,
            total_tipos_bloque: 1,
            tipos_bloque: { A: 2 },
            total_ambientes: 3,
            ambientes_activos: 3,
            ambientes_inactivos: 0,
            total_tipos_ambiente: 2,
            tipos_ambiente: { Lab: 1, Aula: 2 },
            capacidad: { total: 300, examen: 150 },
            activos_asociados: 8,
          },
          facultades: [
            {
              id: 'fac-1',
              codigo: 'F1',
              nombre: 'Fac 1',
              estado: 'activo',
              kpis: {
                total_bloques: 2,
                bloques_activos: 2,
                bloques_inactivos: 0,
                total_tipos_bloque: 1,
                tipos_bloque: { A: 2 },
                total_ambientes: 3,
                ambientes_activos: 3,
                ambientes_inactivos: 0,
                total_tipos_ambiente: 2,
                tipos_ambiente: { Lab: 1, Aula: 2 },
                capacidad: { total: 300, examen: 150 },
                activos_asociados: 8,
              },
              bloques: [
                {
                  id: 'bloq-1',
                  codigo: 'B1',
                  nombre: 'Bloque 1',
                  tipo_bloque: 'A',
                  pisos: 3,
                  estado: 'activo',
                  kpis: {
                    total_ambientes: 2,
                    ambientes_activos: 2,
                    ambientes_inactivos: 0,
                    total_tipos_ambiente: 2,
                    tipos_ambiente: { Lab: 1, Aula: 1 },
                    capacidad: { total: 200, examen: 100 },
                    activos_asociados: 8,
                  },
                  ambientes: [
                    {
                      id: 'amb-1',
                      codigo: 'A1',
                      nombre: 'Amb 1',
                      piso: '1',
                      tipo_ambiente: 'Lab',
                      capacidad: { total: 100, examen: 50 },
                      dimensiones: '10x10',
                      clases: 'N/A',
                      estado: 'activo',
                      activos_count: 5,
                    },
                    {
                      id: 'amb-2',
                      codigo: 'A2',
                      nombre: 'Amb 2',
                      piso: '2',
                      tipo_ambiente: 'Aula',
                      capacidad: { total: 100, examen: 50 },
                      estado: 'activo',
                      activos_count: 3,
                    },
                  ],
                },
              ],
            },
          ],
        },
      } as InventarioReporteViewModel),
      obtener_por_facultad: jest.fn(),
      obtener_por_bloque: jest.fn(),
    };

    const result = await mockRepo.obtener_por_campus('campus-1');
    expect(result.scope).toBe('campus');
    expect(result.campus?.kpis.total_facultades).toBe(1);
    expect(result.campus?.kpis.capacidad?.total).toBe(300);
    expect(result.campus?.kpis.tipos_bloque?.A).toBe(2);
    expect(result.campus?.kpis.tipos_ambiente?.Lab).toBe(1);
    expect(result.campus?.facultades[0].bloques[0].ambientes.length).toBe(2);
    expect(result.campus?.facultades[0].bloques[0].kpis.capacidad?.total).toBe(
      200,
    );
  });
});

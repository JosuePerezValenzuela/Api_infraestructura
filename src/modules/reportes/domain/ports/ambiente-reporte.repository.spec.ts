import {
  AmbienteReporteRepository,
  AmbienteDetalleViewModel,
} from './ambiente-reporte.repository';

describe('AmbienteReporteRepository (contract)', () => {
  class FakeRepo extends AmbienteReporteRepository {
    async obtenerPorId(id: number): Promise<AmbienteDetalleViewModel | null> {
      if (id !== 1) return null;
      return {
        ambiente: {
          id: 1,
          codigo: 'FCyT-001',
          nombre: 'Aula 1',
          nombre_corto: 'A1',
          piso: 1,
          clases: true,
          activo: true,
          capacidad: { total: 40, examen: 30 },
          dimension: { largo: 5, ancho: 6, alto: 3, unid_med: 'metros' },
          creado_en: '2024-01-01T00:00:00Z',
          actualizado_en: '2024-01-02T00:00:00Z',
        },
        bloque: {
          id: 10,
          codigo: 'BLO-10',
          nombre: 'Bloque 10',
          tipo_bloque: { id: 3, nombre: 'Aulas' },
        },
        facultad: {
          id: 5,
          codigo: 'F-05',
          nombre: 'Facultad X',
          nombre_corto: 'FX',
        },
        campus: { id: 2, codigo: 'C-02', nombre: 'Campus Central' },
        tipo_ambiente: { id: 7, nombre: 'Aula' },
        horarios: [{ dia: 0, hora_inicio: '08:00', hora_fin: '10:00' }],
        activos: [{ nia: 'NIA-1', nombre: 'Proyector', descripcion: null }],
        disponibilidadMatriz: [],
      };
    }
  }

  it('retorna null cuando el ambiente no existe', async () => {
    const repo = new FakeRepo();
    const result = await repo.obtenerPorId(999);
    expect(result).toBeNull();
  });

  it('retorna un view-model con las secciones necesarias', async () => {
    const repo = new FakeRepo();
    const result = await repo.obtenerPorId(1);
    expect(result).not.toBeNull();
    expect(result?.ambiente.codigo).toBe('FCyT-001');
    expect(result?.bloque.tipo_bloque.nombre).toBe('Aulas');
    expect(result?.facultad.nombre).toBe('Facultad X');
    expect(result?.campus.nombre).toBe('Campus Central');
    expect(result?.tipo_ambiente.nombre).toBe('Aula');
    expect(result?.horarios.length).toBeGreaterThan(0);
    expect(result?.activos.length).toBeGreaterThan(0);
  });
});

import { AmbienteReporteRepositoryAdapter } from './ambiente-reporte.repository';

describe('AmbienteReporteRepositoryAdapter', () => {
  const makeHeaderRow = () => ({
    ambiente_id: 1,
    ambiente_codigo: 'FCyT-001',
    ambiente_nombre: 'Aula 1',
    ambiente_nombre_corto: 'A1',
    piso: 1,
    clases: true,
    activo: true,
    capacidad: { total: 40, examen: 30 },
    dimension: { largo: 5, ancho: 6, alto: 3, unid_med: 'metros' },
    hora_apertura: '08:00',
    hora_cierre: '10:00',
    periodo: 30,
    creado_en: '2024-01-01T00:00:00Z',
    actualizado_en: '2024-01-02T00:00:00Z',
    bloque_id: 10,
    bloque_codigo: 'B-10',
    bloque_nombre: 'Bloque 10',
    tipo_bloque_id: 3,
    tipo_bloque_nombre: 'Aulas',
    facultad_id: 5,
    facultad_codigo: 'F-05',
    facultad_nombre: 'Facultad X',
    facultad_nombre_corto: 'FX',
    campus_id: 2,
    campus_codigo: 'C-02',
    campus_nombre: 'Campus Central',
    tipo_ambiente_id: 7,
    tipo_ambiente_nombre: 'Aula',
  });

  const horariosRows = [
    { dia: 0, hora_inicio: '08:00', hora_fin: '09:00' },
    { dia: 1, hora_inicio: '08:30', hora_fin: '10:00' },
  ];

  const activosRows = [
    { nia: 'A-001', nombre: 'Proyector', descripcion: null },
    { nia: 'A-002', nombre: 'Sillas', descripcion: '30 unidades' },
  ];

  it('devuelve null si no encuentra el ambiente', async () => {
    const dataSource = { query: jest.fn().mockResolvedValueOnce([]) };
    const repo = new AmbienteReporteRepositoryAdapter(dataSource as any);

    const result = await repo.obtenerPorId(999);
    expect(result).toBeNull();
    expect(dataSource.query).toHaveBeenCalledTimes(1);
  });

  it('mapea el view-model con jerarquia, horarios ordenados y activos', async () => {
    const dataSource = {
      query: jest
        .fn()
        .mockResolvedValueOnce([makeHeaderRow()])
        .mockResolvedValueOnce(horariosRows)
        .mockResolvedValueOnce(activosRows),
    };
    const repo = new AmbienteReporteRepositoryAdapter(dataSource as any);

    const result = await repo.obtenerPorId(1);

    expect(dataSource.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('FROM infraestructura.ambientes'),
      [1],
    );
    expect(dataSource.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('FROM infraestructura.horarios_operacion'),
      [1],
    );
    expect(dataSource.query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('FROM infraestructura.activos'),
      [1],
    );

    expect(result?.ambiente.codigo).toBe('FCyT-001');
    expect(result?.bloque.tipo_bloque.nombre).toBe('Aulas');
    expect(result?.campus.nombre).toBe('Campus Central');
    expect(result?.horarios[0].dia).toBe(0);
    expect(result?.activos[0].nia).toBe('A-001');
    expect(result?.disponibilidadMatriz).toEqual([]); // se setea en capa de applicacion
  });
});

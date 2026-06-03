import { Injectable } from '@nestjs/common';
import Excel from 'exceljs';
import { PassThrough } from 'stream';
import PdfPrinter from 'pdfmake';
import type {
  StyleDictionary,
  TableCell,
  TDocumentDefinitions,
} from 'pdfmake/interfaces';
import {
  ArchivoReporte,
  ReporteGeneradorPort,
} from '../../domain/ports/reporte-generador.port';
import type {
  AmbienteView,
  BloqueView,
  CampusView,
  FacultadView,
  InventarioReporteViewModel,
  KpiResumen,
} from '../../domain/models/inventario.view-model';
import { KpiChartFactory } from '../kpi-chart.factory';

// Tipo auxiliar para el contenido de pdfmake sin usar Content directamente
type PdfContent = TDocumentDefinitions['content'] extends (infer U)[]
  ? U
  : TDocumentDefinitions['content'];

const MIME_XLSX =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const MIME_PDF = 'application/pdf';

// ==================== COLORES ====================
const COLOR_HEADER_BG = '003049';
const COLOR_HEADER_FONT = 'FFFFFF';
const COLOR_ALT_ROW = 'F7F9FB';

@Injectable()
export class ReporteGeneradorAdapter implements ReporteGeneradorPort {
  constructor(private readonly kpiCharts: KpiChartFactory) {}

  // ---------------- XLSX ----------------
  async generar_xlsx(
    view_model: InventarioReporteViewModel,
  ): Promise<ArchivoReporte> {
    const workbook = new Excel.Workbook();
    workbook.created = new Date();
    workbook.modified = new Date();

    this.buildXlsx(workbook, view_model);

    const filename = this.build_filename(view_model.scope, 'xlsx');
    const buffer = await workbook.xlsx.writeBuffer();

    const stream = new PassThrough();
    stream.end(buffer);

    return { stream, filename, mime_type: MIME_XLSX };
  }

  // ---------------- PDF ----------------
  async generar_pdf(
    view_model: InventarioReporteViewModel,
  ): Promise<ArchivoReporte> {
    const docDefinition = await this.buildPdfDefinition(view_model);
    const stream = await this.createPdfStream(docDefinition);
    const filename = this.build_filename(view_model.scope, 'pdf');
    return { stream, filename, mime_type: MIME_PDF };
  }

  // ==================== XLSX ====================

  private buildXlsx(
    workbook: Excel.Workbook,
    view: InventarioReporteViewModel,
  ) {
    if (view.campus) {
      this.buildCampusBooks(workbook, view.campus);
    } else if (view.facultad) {
      this.buildFacultadBooks(workbook, view.facultad);
    } else if (view.bloque) {
      this.buildBloqueBooks(workbook, view.bloque);
    }
  }

  // -----------------------
  // LIBROS POR NIVEL
  // -----------------------

  /**
   * Campus: 4 libros separados
   * - Info Campus: datos de la entidad seleccionada
   * - Facultades: todas las facultades con KPIs
   * - Bloques: todos los bloques con referencia a facultad
   * - Ambientes: todos los ambientes con referencia a bloque y facultad
   */
  private buildCampusBooks(workbook: Excel.Workbook, campus: CampusView) {
    // Libro 1: Info del Campus
    const campusSheet = workbook.addWorksheet('Info Campus');
    this.renderCampusInfo(campusSheet, campus);

    // Libro 2: Facultades (tabla plana)
    const facultadesSheet = workbook.addWorksheet('Facultades');
    this.renderFacultadesList(facultadesSheet, campus.facultades);

    // Libro 3: Bloques (tabla plana)
    const allBloques = campus.facultades.flatMap((f) =>
      f.bloques.map((b) => ({
        ...b,
        facultad_nombre: f.nombre,
        facultad_codigo: f.codigo,
      })),
    );
    if (allBloques.length > 0) {
      const bloquesSheet = workbook.addWorksheet('Bloques');
      this.renderBloquesList(bloquesSheet, allBloques);
    }

    // Libro 4: Ambientes (tabla plana)
    const allAmbientes = campus.facultades.flatMap((f) =>
      f.bloques.flatMap((b) =>
        b.ambientes.map((a) => ({
          ...a,
          bloque_nombre: b.nombre,
          bloque_codigo: b.codigo,
          tipo_bloque: b.tipo_bloque,
          facultad_nombre: f.nombre,
          facultad_codigo: f.codigo,
        })),
      ),
    );
    if (allAmbientes.length > 0) {
      const ambientesSheet = workbook.addWorksheet('Ambientes');
      this.renderAmbientesList(ambientesSheet, allAmbientes);
    }
  }

  /**
   * Facultad: 3 libros separados
   * - Info Facultad: datos de la entidad seleccionada
   * - Bloques: todos los bloques de esta facultad
   * - Ambientes: todos los ambientes de esta facultad
   */
  private buildFacultadBooks(workbook: Excel.Workbook, facultad: FacultadView) {
    // Libro 1: Info de la Facultad
    const facSheet = workbook.addWorksheet('Info Facultad');
    this.renderFacultadInfo(facSheet, facultad);

    // Libro 2: Bloques (tabla plana)
    if (facultad.bloques.length > 0) {
      const bloquesSheet = workbook.addWorksheet('Bloques');
      this.renderBloquesList(bloquesSheet, facultad.bloques);
    }

    // Libro 3: Ambientes (tabla plana)
    const allAmbientes = facultad.bloques.flatMap((b) =>
      b.ambientes.map((a) => ({
        ...a,
        bloque_nombre: b.nombre,
        bloque_codigo: b.codigo,
        tipo_bloque: b.tipo_bloque,
      })),
    );
    if (allAmbientes.length > 0) {
      const ambientesSheet = workbook.addWorksheet('Ambientes');
      this.renderAmbientesList(ambientesSheet, allAmbientes);
    }
  }

  /**
   * Bloque: 2 libros separados
   * - Info Bloque: datos de la entidad seleccionada
   * - Ambientes: todos los ambientes de este bloque
   */
  private buildBloqueBooks(workbook: Excel.Workbook, bloque: BloqueView) {
    // Libro 1: Info del Bloque
    const bloqueSheet = workbook.addWorksheet('Info Bloque');
    this.renderBloqueInfo(bloqueSheet, bloque);

    // Libro 2: Ambientes
    if (bloque.ambientes.length > 0) {
      const ambientesSheet = workbook.addWorksheet('Ambientes');
      const ambientesConBloque = bloque.ambientes.map((a) => ({
        ...a,
        bloque_nombre: bloque.nombre,
        bloque_codigo: bloque.codigo,
        tipo_bloque: bloque.tipo_bloque,
      }));
      this.renderAmbientesList(ambientesSheet, ambientesConBloque);
    }
  }

  // ==================== HOJAS DE INFO (label-value) ====================

  /**
   * Renderiza la info de la entidad como pares label → value,
   * SIN tabla dinámica, SIN colores de estado.
   */
  private renderInfoSheet(
    sheet: Excel.Worksheet,
    title: string,
    fields: { label: string; value: string | number }[],
  ) {
    // Título
    const titleCell = sheet.getCell('A1');
    titleCell.value = title;
    titleCell.font = {
      bold: true,
      size: 14,
      color: { argb: `FF${COLOR_HEADER_BG}` },
    };
    sheet.mergeCells('A1:B1');

    // Filas label → value a partir de la fila 3
    let maxLabelLen = 0;
    let maxValueLen = 0;

    fields.forEach((f, i) => {
      const rowNum = i + 3;
      const lbl = sheet.getCell(`A${rowNum}`);
      const val = sheet.getCell(`B${rowNum}`);

      lbl.value = f.label;
      lbl.font = {
        bold: true,
        size: 11,
        color: { argb: `FF${COLOR_HEADER_BG}` },
      };
      lbl.alignment = { horizontal: 'right', vertical: 'middle' };
      lbl.border = {
        bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
      };

      val.value = f.value;
      val.font = { size: 11 };
      val.alignment = { horizontal: 'left', vertical: 'middle' };
      val.border = {
        bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
      };

      maxLabelLen = Math.max(maxLabelLen, f.label.length);
      maxValueLen = Math.max(maxValueLen, String(f.value).length);
    });

    // Auto-fit: col A (labels en bold) con multiplicador 1.2
    sheet.getColumn(1).width = Math.min(
      Math.max(Math.ceil(maxLabelLen * 1.2 + 4), 12),
      40,
    );
    // Col B (values en regular) con multiplicador 1.1
    sheet.getColumn(2).width = Math.min(
      Math.max(Math.ceil(maxValueLen * 1.1 + 4), 20),
      80,
    );
  }

  private renderCampusInfo(sheet: Excel.Worksheet, campus: CampusView) {
    this.renderInfoSheet(sheet, 'Información del Campus', [
      { label: 'Nombre', value: campus.nombre },
      { label: 'Código', value: campus.codigo },
      { label: 'Dirección', value: campus.direccion },
      { label: 'Estado', value: campus.estado },
    ]);
  }

  private renderFacultadInfo(sheet: Excel.Worksheet, facultad: FacultadView) {
    this.renderInfoSheet(sheet, 'Información de la Facultad', [
      { label: 'Nombre', value: facultad.nombre },
      { label: 'Código', value: facultad.codigo },
      { label: 'Estado', value: facultad.estado },
    ]);
  }

  private renderBloqueInfo(sheet: Excel.Worksheet, bloque: BloqueView) {
    this.renderInfoSheet(sheet, 'Información del Bloque', [
      { label: 'Nombre', value: bloque.nombre },
      { label: 'Código', value: bloque.codigo },
      { label: 'Tipo', value: bloque.tipo_bloque },
      { label: 'Pisos', value: bloque.pisos },
      { label: 'Estado', value: bloque.estado },
    ]);
  }

  // ==================== TABLAS DINÁMICAS (Excel ListObject) ====================

  /**
   * Crea una tabla dinámica de Excel con addTable.
   * - Autofiltro incluido
   * - Filas bandeadas (alternadas)
   * - Encabezado con nuestro estilo azul oscuro
   * - SIN colorear el estado (texto plano)
   */
  private renderDynamicTable(
    sheet: Excel.Worksheet,
    name: string,
    columns: { name: string }[],
    rows: unknown[][],
    numberFormatRanges?: { colLetter: string; format: string }[],
  ) {
    if (rows.length === 0) {
      sheet.getCell('A1').value = `No hay datos disponibles`;
      // Ancho mínimo para que no se corte el mensaje
      sheet.getColumn(1).width = 30;
      return;
    }

    // Crear tabla dinámica con ExcelJS addTable
    sheet.addTable({
      name,
      displayName: name,
      ref: 'A1',
      headerRow: true,
      style: {
        theme: 'TableStyleMedium2',
        showRowStripes: true,
      },
      columns: columns.map((c) => ({
        name: c.name,
        filterButton: true,
      })),
      rows,
    });

    // Aplicar nuestro estilo de encabezado (fondo azul oscuro, texto blanco)
    const headerRow = sheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: `FF${COLOR_HEADER_BG}` },
      };
      cell.font = {
        bold: true,
        color: { argb: `FF${COLOR_HEADER_FONT}` },
        size: 11,
      };
      cell.alignment = {
        horizontal: 'center',
        vertical: 'middle',
      };
    });
    headerRow.height = 20;

    // Número de fila final de la tabla (header + data)
    const endRow = rows.length + 1;

    // Formato numérico para columnas específicas
    if (numberFormatRanges) {
      for (const range of numberFormatRanges) {
        this.applyNumberFormat(
          sheet,
          `${range.colLetter}2:${range.colLetter}${endRow}`,
          range.format,
        );
      }
    }

    // Auto-fit: el header está en bold + botón de filtro.
    // Multiplicador 1.2 compensa bold + caracteres anchos (W, Ó, etc.)
    // +6 extra para botón de filtro, padding de celda, etc.
    for (let colIdx = 0; colIdx < columns.length; colIdx++) {
      const headerLen = columns[colIdx].name.length;
      let maxDataLen = 0;
      for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
        const val = rows[rowIdx][colIdx];
        if (val != null) {
          maxDataLen = Math.max(maxDataLen, String(val).length);
        }
      }
      const longest = Math.max(headerLen, maxDataLen);
      // Fórmula: (longest * 1.2) para bold + 6 de padding visual
      const width = Math.ceil(longest * 1.2 + 6);
      // Capping a 80 para evitar columnas monstruosas
      sheet.getColumn(colIdx + 1).width = Math.min(Math.max(width, 12), 80);
    }
  }

  private renderFacultadesList(
    sheet: Excel.Worksheet,
    facultades: FacultadView[],
  ) {
    const rows = facultades.map((fac) => [
      fac.codigo,
      fac.nombre,
      fac.estado,
      fac.bloques.length,
      fac.bloques.reduce((acc, b) => acc + b.ambientes.length, 0),
    ]);

    this.renderDynamicTable(
      sheet,
      'Facultades',
      [
        { name: 'Código' },
        { name: 'Nombre' },
        { name: 'Estado' },
        { name: 'Total Bloques' },
        { name: 'Total Ambientes' },
      ],
      rows,
      [
        { colLetter: 'D', format: '#,##0' },
        { colLetter: 'E', format: '#,##0' },
      ],
    );
  }

  private renderBloquesList(
    sheet: Excel.Worksheet,
    bloques: Array<
      BloqueView & { facultad_nombre?: string; facultad_codigo?: string }
    >,
  ) {
    const tieneFacultad = bloques.length > 0 && 'facultad_nombre' in bloques[0];

    const columns: { name: string }[] = [
      { name: 'Código' },
      { name: 'Nombre' },
      { name: 'Tipo' },
      { name: 'Pisos' },
      { name: 'Estado' },
      { name: 'Total Ambientes' },
    ];

    if (tieneFacultad) {
      columns.push({ name: 'Facultad Código' }, { name: 'Facultad Nombre' });
    }

    const rows = bloques.map((b) => {
      const row: unknown[] = [
        b.codigo,
        b.nombre,
        b.tipo_bloque,
        b.pisos,
        b.estado,
        b.ambientes.length,
      ];
      if (tieneFacultad) {
        row.push(b.facultad_codigo ?? '', b.facultad_nombre ?? '');
      }
      return row;
    });

    // La columna 'Total Ambientes' es la 6ª (F), con formato numérico
    this.renderDynamicTable(sheet, 'Bloques', columns, rows, [
      { colLetter: 'F', format: '#,##0' },
    ]);
  }

  private renderAmbientesList(
    sheet: Excel.Worksheet,
    ambientes: Array<
      AmbienteView & {
        bloque_nombre?: string;
        bloque_codigo?: string;
        tipo_bloque?: string;
        facultad_nombre?: string;
        facultad_codigo?: string;
      }
    >,
  ) {
    const tieneFacultad =
      ambientes.length > 0 && 'facultad_nombre' in ambientes[0];
    const tieneBloque = ambientes.length > 0 && 'bloque_nombre' in ambientes[0];

    const columns: { name: string }[] = [
      { name: 'Código' },
      { name: 'Nombre' },
      { name: 'Piso' },
      { name: 'Tipo Ambiente' },
      { name: 'Cap. Total' },
      { name: 'Cap. Examen' },
      { name: 'Dimensiones' },
      { name: 'Clases' },
      { name: 'Estado' },
      { name: '# Activos' },
    ];

    if (tieneBloque) {
      columns.push(
        { name: 'Bloque Código' },
        { name: 'Bloque Nombre' },
        { name: 'Tipo Bloque' },
      );
    }

    if (tieneFacultad) {
      columns.push({ name: 'Facultad Código' }, { name: 'Facultad Nombre' });
    }

    const rows = ambientes.map((amb) => {
      const row: unknown[] = [
        amb.codigo,
        amb.nombre,
        amb.piso,
        amb.tipo_ambiente,
        amb.capacidad.total,
        amb.capacidad.examen,
        amb.dimensiones ?? '',
        amb.clases ? 'Sí' : 'No',
        amb.estado,
        amb.activos_count,
      ];
      if (tieneBloque) {
        row.push(
          amb.bloque_codigo ?? '',
          amb.bloque_nombre ?? '',
          amb.tipo_bloque ?? '',
        );
      }
      if (tieneFacultad) {
        row.push(amb.facultad_codigo ?? '', amb.facultad_nombre ?? '');
      }
      return row;
    });

    // Columnas numéricas: siempre en posiciones fijas 5 (Cap.Total),
    // 6 (Cap.Examen) y 10 (# Activos). Las columnas opcionales de
    // bloque/facultad se agregan después.
    const numFormats: { colLetter: string; format: string }[] = [
      { colLetter: this.getColumnLetter(5), format: '#,##0' },
      { colLetter: this.getColumnLetter(6), format: '#,##0' },
      { colLetter: this.getColumnLetter(10), format: '#,##0' },
    ];

    this.renderDynamicTable(sheet, 'Ambientes', columns, rows, numFormats);
  }

  // ==================== HELPERS DE ESTILO ====================

  private applyNumberFormat(
    sheet: Excel.Worksheet,
    range: string,
    format: string,
  ) {
    // sheet.getCell() no acepta rangos como 'F2:K5'.
    // Parseamos el rango y aplicamos el formato a cada celda.
    const match = range.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/);
    if (!match) return;

    const [, colStart, rowStartStr, colEnd, rowEndStr] = match;
    const rowStart = parseInt(rowStartStr, 10);
    const rowEnd = parseInt(rowEndStr, 10);
    const startIdx = this.columnLetterToIndex(colStart);
    const endIdx = this.columnLetterToIndex(colEnd);

    for (let r = rowStart; r <= rowEnd; r++) {
      for (let c = startIdx; c <= endIdx; c++) {
        const cell = sheet.getRow(r).getCell(c);
        cell.numFmt = format;
      }
    }
  }

  /** Convierte letra de columna (A, B, ..., Z, AA, ...) a índice 1-based */
  private columnLetterToIndex(letter: string): number {
    let index = 0;
    for (let i = 0; i < letter.length; i++) {
      index = index * 26 + (letter.charCodeAt(i) - 64);
    }
    return index;
  }

  private getColumnLetter(colNumber: number): string {
    let letter = '';
    while (colNumber > 0) {
      colNumber--;
      letter = String.fromCharCode((colNumber % 26) + 65) + letter;
      colNumber = Math.floor(colNumber / 26);
    }
    return letter;
  }

  private build_filename(scope: string, ext: string) {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `inventario_${scope}_${date}.${ext}`;
  }

  // ==================== PDF ====================

  private async buildPdfDefinition(
    view: InventarioReporteViewModel,
  ): Promise<TDocumentDefinitions> {
    const content: PdfContent[] = [];

    if (view.campus) {
      const campusCharts = await this.buildKpiChartsRow(view.campus.kpis);
      content.push(...this.sectionCampus(view.campus, false, campusCharts));

      for (const fac of view.campus.facultades) {
        const facCharts = await this.buildKpiChartsRow(fac.kpis);
        content.push(...this.sectionFacultad(fac, true, facCharts));
      }
    } else if (view.facultad) {
      const facCharts = await this.buildKpiChartsRow(view.facultad.kpis);
      content.push(...this.sectionFacultad(view.facultad, false, facCharts));
    } else if (view.bloque) {
      const bloqueCharts = await this.buildKpiChartsRow(view.bloque.kpis);
      content.push(...this.sectionBloque(view.bloque, false, bloqueCharts));
    }

    const styles: StyleDictionary = {
      header: {
        fontSize: 16,
        bold: true,
        color: COLOR_HEADER_BG,
        margin: [0, 0, 0, 8],
      },
      subheader: {
        fontSize: 12,
        bold: true,
        color: COLOR_HEADER_BG,
        margin: [0, 8, 0, 4],
      },
      kpiLabel: { fontSize: 10, color: COLOR_HEADER_BG },
      tableHeader: { bold: true, fillColor: COLOR_HEADER_BG, color: '#ffffff' },
    };

    return {
      content,
      styles,
      defaultStyle: { font: 'Helvetica', fontSize: 10 },
      pageMargins: [40, 60, 40, 40],
    };
  }

  private sectionCampus(
    campus: CampusView,
    pageBreak = false,
    chartsRow?: PdfContent | null,
  ): PdfContent[] {
    const blocks: PdfContent[] = [];

    blocks.push({
      text: `Campus: ${campus.nombre}`,
      style: 'header',
      pageBreak: pageBreak ? 'before' : undefined,
    });

    if (chartsRow) {
      blocks.push(chartsRow);
    }

    blocks.push(...this.kpiTable(campus.kpis));

    blocks.push(
      this.simpleTable(
        'Facultades',
        campus.facultades.map<(string | number)[]>((f) => [
          f.codigo,
          f.nombre,
          f.estado,
          f.kpis.total_bloques ?? 0,
          f.kpis.total_ambientes ?? 0,
          f.kpis.capacidad?.total ?? 0,
          f.kpis.capacidad?.examen ?? 0,
          f.kpis.activos_asociados ?? 0,
        ]),
        [
          'Código',
          'Nombre',
          'Estado',
          '#Bloques',
          '#Ambientes',
          'Cap. Total',
          'Cap. Examen',
          '#Activos',
        ],
        ['auto', '*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
      ),
    );

    return blocks;
  }

  private sectionFacultad(
    fac: FacultadView,
    pageBreak: boolean,
    chartsRow?: PdfContent | null,
  ): PdfContent[] {
    const blocks: PdfContent[] = [];

    blocks.push({
      text: `Facultad: ${fac.nombre}`,
      style: 'header',
      pageBreak: pageBreak ? 'before' : undefined,
    });

    if (chartsRow) {
      blocks.push(chartsRow);
    }

    blocks.push(...this.kpiTable(fac.kpis));

    blocks.push(
      this.simpleTable(
        'Bloques',
        fac.bloques.map<(string | number)[]>((b) => [
          b.codigo,
          b.nombre,
          b.tipo_bloque,
          b.estado,
          b.kpis.total_ambientes ?? 0,
          b.kpis.capacidad?.total ?? 0,
          b.kpis.capacidad?.examen ?? 0,
          b.kpis.activos_asociados ?? 0,
        ]),
        [
          'Código',
          'Nombre',
          'Tipo',
          'Estado',
          '#Ambientes',
          'Cap. Total',
          'Cap. Examen',
          '#Activos',
        ],
        ['auto', '*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
      ),
    );

    fac.bloques.forEach((b) => {
      blocks.push(...this.sectionBloque(b, true));
    });

    return blocks;
  }

  private sectionBloque(
    bloque: BloqueView,
    pageBreak: boolean,
    chartsRow?: PdfContent | null,
  ): PdfContent[] {
    const blocks: PdfContent[] = [];

    blocks.push({
      text: `Bloque: ${bloque.nombre}`,
      style: 'subheader',
      pageBreak: pageBreak ? 'before' : undefined,
    });

    if (chartsRow) {
      blocks.push(chartsRow);
    }

    blocks.push(...this.kpiTable(bloque.kpis, true));

    blocks.push(
      this.simpleTable(
        'Ambientes',
        bloque.ambientes.map<(string | number)[]>((a) => [
          a.codigo,
          a.nombre,
          a.piso,
          a.tipo_ambiente,
          `${a.capacidad.total}/${a.capacidad.examen}`,
          a.dimensiones ?? '',
          a.clases ? 'Sí' : 'No',
          a.estado,
          a.activos_count,
        ]),
        [
          'Código',
          'Nombre',
          'Piso',
          'Tipo',
          'Capacidad T/Ex',
          'Dimensiones',
          'Clases',
          'Estado',
          '#Activos',
        ],
        [45, 105, 20, 45, 55, 70, 30, 40, 40],
      ),
    );

    return blocks;
  }

  private kpiTable(kpis: KpiResumen, _compact = false): PdfContent[] {
    const cards: { label: string; value: number }[] = [];

    const push = (label: string, value?: number) => {
      if (value === undefined) return;
      cards.push({ label, value });
    };

    push('Total facultades', kpis.total_facultades);
    push('Facultades activas', kpis.facultades_activas);
    push('Facultades inactivas', kpis.facultades_inactivas);

    push('Total bloques', kpis.total_bloques);
    push('Bloques activos', kpis.bloques_activos);
    push('Bloques inactivos', kpis.bloques_inactivos);
    push('Total tipos de bloque', kpis.total_tipos_bloque);

    push('Total ambientes', kpis.total_ambientes);
    push('Ambientes activos', kpis.ambientes_activos);
    push('Ambientes inactivos', kpis.ambientes_inactivos);
    push('Total tipos de ambiente', kpis.total_tipos_ambiente);

    if (kpis.capacidad) {
      push('Capacidad total', kpis.capacidad.total);
      push('Capacidad examen', kpis.capacidad.examen);
    }
    push('Activos asociados', kpis.activos_asociados);

    if (!cards.length) {
      return [];
    }

    const makeCard = (label: string, value?: number) => {
      if (value === undefined) return null;
      return {
        margin: [0, 4, 8, 4],
        stack: [
          { text: label, fontSize: 9, color: '#4b5563', alignment: 'center' },
          {
            text: String(value),
            fontSize: 14,
            bold: true,
            color: COLOR_HEADER_BG,
            alignment: 'center',
            margin: [0, 4, 0, 0],
          },
        ],
        fillColor: COLOR_ALT_ROW,
        border: [true, true, true, true],
        borderColor: [
          COLOR_HEADER_BG,
          COLOR_HEADER_BG,
          COLOR_HEADER_BG,
          COLOR_HEADER_BG,
        ],
        borderWidth: 0.5,
      };
    };

    const rows: PdfContent[] = [];
    const pushRow = (items: (ReturnType<typeof makeCard> | null)[]) => {
      const cols = items.filter((c): c is NonNullable<typeof c> => !!c);
      if (!cols.length) return;
      rows.push({
        columns: cols as unknown as PdfContent[],
        columnGap: 8,
        margin: [0, 4, 0, 4],
      } as PdfContent);
    };

    pushRow([
      makeCard('Total facultades', kpis.total_facultades),
      makeCard('Facultades activas', kpis.facultades_activas),
      makeCard('Facultades inactivas', kpis.facultades_inactivas),
    ]);
    pushRow([
      makeCard('Total bloques', kpis.total_bloques),
      makeCard('Bloques activos', kpis.bloques_activos),
      makeCard('Bloques inactivos', kpis.bloques_inactivos),
    ]);
    pushRow([
      makeCard('Total ambientes', kpis.total_ambientes),
      makeCard('Ambientes activos', kpis.ambientes_activos),
      makeCard('Ambientes inactivos', kpis.ambientes_inactivos),
    ]);
    pushRow([
      makeCard('Total tipos de bloque', kpis.total_tipos_bloque),
      makeCard('Total tipos de ambiente', kpis.total_tipos_ambiente),
    ]);
    pushRow([
      makeCard('Capacidad total', kpis.capacidad?.total),
      makeCard('Capacidad examen', kpis.capacidad?.examen),
      makeCard('Activos asociados', kpis.activos_asociados),
    ]);

    return rows;
  }

  private simpleTable(
    _title: string,
    rows: (string | number)[][],
    headers: string[],
    widths?: Array<string | number>,
  ): PdfContent {
    return {
      margin: [0, 6, 0, 6],
      table: {
        headerRows: 1,
        widths: widths ?? Array(headers.length).fill('auto'),
        body: [
          headers.map<TableCell>((h) => ({
            text: h,
            color: 'white',
            bold: true,
            alignment: 'center',
            fontSize: 9,
          })),
          ...rows.map<TableCell[]>((r) =>
            r.map<TableCell>((cell, idx) => ({
              text: String(cell ?? ''),
              alignment: idx === 1 || idx === 5 ? 'left' : 'center',
              fontSize: 9,
            })),
          ),
        ],
      },
      layout: {
        fillColor: (rowIndex: number) =>
          rowIndex === 0
            ? COLOR_HEADER_BG
            : rowIndex % 2 === 0
              ? COLOR_ALT_ROW
              : null,
        hLineColor: () => '#cccccc',
        vLineColor: () => '#cccccc',
        paddingLeft: () => 2,
        paddingRight: () => 2,
      },
    };
  }

  private async createPdfStream(
    docDefinition: TDocumentDefinitions,
  ): Promise<PassThrough> {
    const printer = new PdfPrinter({
      Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique',
      },
    });

    return await new Promise<PassThrough>((resolve) => {
      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      const stream = new PassThrough();

      pdfDoc.on('error', (err) => {
        console.error('[PDF] Error en pdfDoc:', err);
        const error =
          err instanceof Error ? err : new Error(String(err ?? 'Error PDF'));
        stream.destroy(error);
      });

      stream.on('error', (err) => {
        console.error('[PDF] Error en stream:', err);
      });

      pdfDoc.pipe(stream);
      pdfDoc.end();

      resolve(stream);
    });
  }

  private async buildKpiChartsRow(
    kpis: KpiResumen,
  ): Promise<PdfContent | null> {
    const charts: PdfContent[] = [];

    if (
      kpis.facultades_activas !== undefined ||
      kpis.facultades_inactivas !== undefined
    ) {
      const buffer = await this.kpiCharts.buildEstadoDonut({
        title: 'Facultades',
        activos: kpis.facultades_activas ?? 0,
        inactivos: kpis.facultades_inactivas ?? 0,
      });

      if (buffer) {
        charts.push({
          image: buffer as unknown as string,
          width: 160,
          margin: [0, 0, 10, 0],
        });
      }
    }

    if (
      kpis.bloques_activos !== undefined ||
      kpis.bloques_inactivos !== undefined
    ) {
      const buffer = await this.kpiCharts.buildEstadoDonut({
        title: 'Bloques',
        activos: kpis.bloques_activos ?? 0,
        inactivos: kpis.bloques_inactivos ?? 0,
      });

      if (buffer) {
        charts.push({
          image: buffer as unknown as string,
          width: 160,
          margin: [0, 0, 10, 0],
        });
      }
    }

    if (
      kpis.ambientes_activos !== undefined ||
      kpis.ambientes_inactivos !== undefined
    ) {
      const buffer = await this.kpiCharts.buildEstadoDonut({
        title: 'Ambientes',
        activos: kpis.ambientes_activos ?? 0,
        inactivos: kpis.ambientes_inactivos ?? 0,
      });

      if (buffer) {
        charts.push({
          image: buffer as unknown as string,
          width: 160,
          margin: [0, 0, 10, 0],
        });
      }
    }

    if (!charts.length) {
      return null;
    }

    return {
      margin: [0, 4, 0, 8],
      columns: charts,
    };
  }
}

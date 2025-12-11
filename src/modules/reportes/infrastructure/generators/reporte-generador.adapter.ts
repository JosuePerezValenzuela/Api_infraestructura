/* eslint-disable @typescript-eslint/no-unsafe-assignment,
                  @typescript-eslint/no-unsafe-call,
                  @typescript-eslint/no-unsafe-member-access,
                  @typescript-eslint/no-unsafe-argument */
import { Injectable } from '@nestjs/common';
import Excel from 'exceljs';
import { PassThrough } from 'stream';
import PdfPrinter from 'pdfmake';
import * as path from 'path';
import * as fs from 'fs';
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

type SheetRow = Record<string, string | number | undefined>;

const PRIMARY = '#003049';
const LIGHT_BG = '#f7f9fb';
const ACCENT = '#669bbc';

@Injectable()
export class ReporteGeneradorAdapter implements ReporteGeneradorPort {
  constructor(private readonly kpiCharts: KpiChartFactory) {}

  // ---------------- XLSX ----------------
  async generar_xlsx(
    view_model: InventarioReporteViewModel,
  ): Promise<ArchivoReporte> {
    const stream = new PassThrough();
    const workbook = new Excel.stream.xlsx.WorkbookWriter({
      stream,
      useStyles: true,
      useSharedStrings: true,
    });

    this.buildXlsx(workbook, view_model);
    await workbook.commit();

    const filename = this.build_filename(view_model.scope, 'xlsx');
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

  // ---------------- XLSX helpers ----------------
  private buildXlsx(
    workbook: Excel.stream.xlsx.WorkbookWriter,
    view: InventarioReporteViewModel,
  ) {
    const resumen = workbook.addWorksheet('Resumen');
    this.renderResumenSheet(resumen, view);

    if (view.campus) {
      const campusSheet = workbook.addWorksheet(
        this.sanitizeSheetName(`Campus_${view.campus.nombre}`),
      );
      this.renderCampusSheet(campusSheet, view.campus);

      view.campus.facultades.forEach((fac) => {
        const facSheet = workbook.addWorksheet(
          this.sanitizeSheetName(`Fac_${fac.nombre}`),
        );
        this.renderFacultadSheet(facSheet, fac);

        const bloquesSheet = workbook.addWorksheet(
          this.sanitizeSheetName(`Bloques_${fac.nombre}`),
        );
        this.renderBloquesSheet(bloquesSheet, fac.bloques);
      });
    } else if (view.facultad) {
      const facSheet = workbook.addWorksheet(
        this.sanitizeSheetName(`Fac_${view.facultad.nombre}`),
      );
      this.renderFacultadSheet(facSheet, view.facultad);

      const bloquesSheet = workbook.addWorksheet(
        this.sanitizeSheetName(`Bloques_${view.facultad.nombre}`),
      );
      this.renderBloquesSheet(bloquesSheet, view.facultad.bloques);
    } else if (view.bloque) {
      const bloqueSheet = workbook.addWorksheet(
        this.sanitizeSheetName(`Bloque_${view.bloque.nombre}`),
      );
      this.renderBloqueSheet(bloqueSheet, view.bloque);
    }
  }

  private renderResumenSheet(
    sheet: Excel.Worksheet,
    view: InventarioReporteViewModel,
  ) {
    sheet.columns = [
      { header: 'Indicador', key: 'indicador', width: 30 },
      { header: 'Valor', key: 'valor', width: 20 },
    ];

    if (view.campus) {
      sheet.addRow({ indicador: 'Campus', valor: view.campus.nombre }).commit();
      this.pushKpis(sheet, view.campus.kpis);
    }
    if (view.facultad) {
      sheet
        .addRow({ indicador: 'Facultad', valor: view.facultad.nombre })
        .commit();
      this.pushKpis(sheet, view.facultad.kpis);
    }
    if (view.bloque) {
      sheet.addRow({ indicador: 'Bloque', valor: view.bloque.nombre }).commit();
      this.pushKpis(sheet, view.bloque.kpis);
    }

    sheet.commit();
  }

  private renderCampusSheet(sheet: Excel.Worksheet, campus: CampusView) {
    sheet.columns = [
      { header: 'Campo', key: 'campo', width: 25 },
      { header: 'Valor', key: 'valor', width: 60 },
    ];
    sheet.addRow({ campo: 'Nombre', valor: campus.nombre }).commit();
    sheet.addRow({ campo: 'Código', valor: campus.codigo }).commit();
    sheet.addRow({ campo: 'Dirección', valor: campus.direccion }).commit();
    sheet.addRow({ campo: 'Estado', valor: campus.estado }).commit();
    this.pushKpis(sheet, campus.kpis);
    sheet.commit();
  }

  private renderFacultadSheet(sheet: Excel.Worksheet, fac: FacultadView) {
    sheet.columns = [
      { header: 'Campo', key: 'campo', width: 25 },
      { header: 'Valor', key: 'valor', width: 60 },
    ];
    sheet.addRow({ campo: 'Nombre', valor: fac.nombre }).commit();
    sheet.addRow({ campo: 'Código', valor: fac.codigo }).commit();
    sheet.addRow({ campo: 'Estado', valor: fac.estado }).commit();
    this.pushKpis(sheet, fac.kpis);
    sheet.commit();
  }

  private renderBloqueSheet(sheet: Excel.Worksheet, bloque: BloqueView) {
    sheet.columns = [
      { header: 'Campo', key: 'campo', width: 25 },
      { header: 'Valor', key: 'valor', width: 60 },
    ];
    sheet.addRow({ campo: 'Nombre', valor: bloque.nombre }).commit();
    sheet.addRow({ campo: 'Código', valor: bloque.codigo }).commit();
    sheet.addRow({ campo: 'Tipo', valor: bloque.tipo_bloque }).commit();
    sheet.addRow({ campo: 'Pisos', valor: bloque.pisos }).commit();
    sheet.addRow({ campo: 'Estado', valor: bloque.estado }).commit();
    this.pushKpis(sheet, bloque.kpis);
    this.pushAmbientesTable(sheet, bloque.ambientes);
    sheet.commit();
  }

  private renderBloquesSheet(
    sheet: Excel.Worksheet,
    bloques: BloqueView[],
  ): void {
    sheet.columns = [
      { header: 'Código', key: 'codigo', width: 15 },
      { header: 'Nombre', key: 'nombre', width: 25 },
      { header: 'Tipo', key: 'tipo', width: 15 },
      { header: 'Pisos', key: 'pisos', width: 10 },
      { header: 'Estado', key: 'estado', width: 12 },
      { header: '# Ambientes', key: 'ambientes', width: 15 },
      { header: 'Capacidad Total', key: 'capacidad_total', width: 18 },
      { header: 'Cap. Examen', key: 'capacidad_examen', width: 15 },
      { header: '# Activos', key: 'activos', width: 12 },
    ];

    bloques.forEach((b) => {
      const k = this.computeAmbientesResumen(b.ambientes);
      const row: SheetRow = {
        codigo: b.codigo,
        nombre: b.nombre,
        tipo: b.tipo_bloque,
        pisos: b.pisos,
        estado: b.estado,
        ambientes: b.ambientes.length,
        capacidad_total: k.cap_total,
        capacidad_examen: k.cap_examen,
        activos: k.activos,
      };
      sheet.addRow(row).commit();
    });
    sheet.commit();
  }

  private pushAmbientesTable(
    sheet: Excel.Worksheet,
    ambientes: AmbienteView[],
  ) {
    sheet.addRow({ campo: 'Ambientes', valor: '' }).commit();
    sheet
      .addRow({
        campo: 'Código',
        valor:
          'Nombre / Piso / Tipo / Capacidad T/Ex / Dimensiones / Clases / Estado / #Activos',
      })
      .commit();

    ambientes.forEach((a) => {
      const dimensiones = a.dimensiones ?? '';
      const clasesLabel = a.clases ? 'Sí' : 'No';
      const valor = `${a.nombre} / ${a.piso} / ${a.tipo_ambiente} / ${a.capacidad.total}/${a.capacidad.examen} / ${dimensiones} / ${clasesLabel} / ${a.estado} / ${a.activos_count}`;
      sheet.addRow({ campo: a.codigo, valor }).commit();
    });
  }

  private pushKpis(sheet: Excel.Worksheet, kpis: KpiResumen) {
    const rows: SheetRow[] = [];

    if (kpis.total_facultades !== undefined) {
      rows.push({
        indicador: 'Total facultades',
        valor: kpis.total_facultades,
      });
      rows.push({
        indicador: 'Facultades activas',
        valor: kpis.facultades_activas,
      });
      rows.push({
        indicador: 'Facultades inactivas',
        valor: kpis.facultades_inactivas,
      });
    }
    if (kpis.total_bloques !== undefined) {
      rows.push({ indicador: 'Total bloques', valor: kpis.total_bloques });
      rows.push({ indicador: 'Bloques activos', valor: kpis.bloques_activos });
      rows.push({
        indicador: 'Bloques inactivos',
        valor: kpis.bloques_inactivos,
      });
    }
    if (kpis.total_tipos_bloque !== undefined) {
      rows.push({
        indicador: 'Total tipos de bloque',
        valor: kpis.total_tipos_bloque,
      });
    }
    if (kpis.total_ambientes !== undefined) {
      rows.push({ indicador: 'Total ambientes', valor: kpis.total_ambientes });
      rows.push({
        indicador: 'Ambientes activos',
        valor: kpis.ambientes_activos,
      });
      rows.push({
        indicador: 'Ambientes inactivos',
        valor: kpis.ambientes_inactivos,
      });
    }
    if (kpis.total_tipos_ambiente !== undefined) {
      rows.push({
        indicador: 'Total tipos de ambiente',
        valor: kpis.total_tipos_ambiente,
      });
    }
    if (kpis.capacidad) {
      rows.push({
        indicador: 'Capacidad total (asientos)',
        valor: kpis.capacidad.total,
      });
      rows.push({
        indicador: 'Capacidad examen (asientos)',
        valor: kpis.capacidad.examen,
      });
    }
    if (kpis.activos_asociados !== undefined) {
      rows.push({
        indicador: 'Activos asociados',
        valor: kpis.activos_asociados,
      });
    }

    rows.forEach((r) => sheet.addRow(r).commit());
  }

  private sanitizeSheetName(name: string): string {
    const forbidden = /[\\/?*[\]:]/g;
    const sanitized = name.replace(forbidden, '_').slice(0, 31);
    return sanitized || 'Hoja';
  }

  private build_filename(scope: string, ext: string) {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `inventario_${scope}_${date}.${ext}`;
  }

  private computeAmbientesResumen(ambientes: AmbienteView[]) {
    return ambientes.reduce(
      (acc, a) => {
        acc.cap_total += a.capacidad.total ?? 0;
        acc.cap_examen += a.capacidad.examen ?? 0;
        acc.activos += a.activos_count ?? 0;
        return acc;
      },
      { cap_total: 0, cap_examen: 0, activos: 0 },
    );
  }

  // ---------------- PDF helpers ----------------
  private async buildPdfDefinition(
    view: InventarioReporteViewModel,
  ): Promise<TDocumentDefinitions> {
    const content: PdfContent[] = [];

    if (view.campus) {
      // 1) Página del CAMPUS
      const campusCharts = await this.buildKpiChartsRow(view.campus.kpis);
      content.push(...this.sectionCampus(view.campus, false, campusCharts));

      // 2) Una página nueva por FACULTAD (cada una con sus bloques dentro)
      for (const fac of view.campus.facultades) {
        const facCharts = await this.buildKpiChartsRow(fac.kpis);
        content.push(...this.sectionFacultad(fac, true, facCharts));
      }
    } else if (view.facultad) {
      // Scope = facultad: primera página la facultad,
      // y dentro de sectionFacultad ya se agregan sus bloques (cada uno en página nueva)
      const facCharts = await this.buildKpiChartsRow(view.facultad.kpis);
      content.push(...this.sectionFacultad(view.facultad, false, facCharts));
    } else if (view.bloque) {
      // Scope = bloque: solo el bloque
      const bloqueCharts = await this.buildKpiChartsRow(view.bloque.kpis);
      content.push(...this.sectionBloque(view.bloque, false, bloqueCharts));
    }

    const styles: StyleDictionary = {
      header: {
        fontSize: 16,
        bold: true,
        color: PRIMARY,
        margin: [0, 0, 0, 8],
      },
      subheader: {
        fontSize: 12,
        bold: true,
        color: PRIMARY,
        margin: [0, 8, 0, 4],
      },
      kpiLabel: { fontSize: 10, color: PRIMARY },
      tableHeader: { bold: true, fillColor: PRIMARY, color: '#ffffff' },
    };

    return {
      content,
      defaultStyle: { font: 'Roboto' },
      styles,
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
      ),
    );

    // Cada bloque en página nueva (nodo)
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

    // Solo agregamos las métricas que apliquen al nodo actual (se omiten si vienen indefinidas).
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

    // Layout: filas predefinidas por orden solicitado.
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
            color: PRIMARY,
            alignment: 'center',
            margin: [0, 4, 0, 0],
          },
        ],
        fillColor: LIGHT_BG,
        border: [true, true, true, true],
        borderColor: [ACCENT, ACCENT, ACCENT, ACCENT],
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
  ): PdfContent {
    return {
      margin: [0, 6, 0, 6],
      table: {
        headerRows: 1,
        widths: Array(headers.length).fill('auto'),
        body: [
          headers.map<TableCell>((h) => ({
            text: h,
            color: 'white',
            bold: true,
            alignment: 'center',
          })),
          ...rows.map<TableCell[]>((r) =>
            r.map<TableCell>((cell) => ({
              text: String(cell ?? ''),
              alignment: 'center',
            })),
          ),
        ],
      },
      layout: {
        fillColor: (rowIndex: number) =>
          rowIndex === 0 ? PRIMARY : rowIndex % 2 === 0 ? LIGHT_BG : null,
        hLineColor: () => '#cccccc',
        vLineColor: () => '#cccccc',
      },
    };
  }

  private async createPdfStream(
    docDefinition: TDocumentDefinitions,
  ): Promise<PassThrough> {
    const fontsPath =
      process.env.PDF_FONTS_DIR ??
      path.join(process.cwd(), 'src', 'assets', 'fonts');

    console.log('[PDF] Usando fontsPath:', fontsPath);

    const requiredFonts = [
      'Roboto-Regular.ttf',
      'Roboto-Medium.ttf',
      'Roboto-Italic.ttf',
      'Roboto-MediumItalic.ttf',
    ];

    for (const font of requiredFonts) {
      const fullPath = path.join(fontsPath, font);
      if (!fs.existsSync(fullPath)) {
        console.error(
          `Fuente de PDF no encontrada: ${fullPath}. Revisa la ruta o la variable PDF_FONTS_DIR.`,
        );
        throw new Error(
          'No se encontraron las fuentes requeridas para generar el PDF',
        );
      }
    }

    const printer = new PdfPrinter({
      Roboto: {
        normal: path.join(fontsPath, 'Roboto-Regular.ttf'),
        bold: path.join(fontsPath, 'Roboto-Medium.ttf'),
        italics: path.join(fontsPath, 'Roboto-Italic.ttf'),
        bolditalics: path.join(fontsPath, 'Roboto-MediumItalic.ttf'),
      },
    });

    // Resolvemos el stream inmediatamente; Express hará stream.pipe(res)
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

    // Facultades
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
        const chartImage: PdfContent = {
          // pdfmake acepta Buffer en runtime, pero los tipos esperan string
          image: buffer as unknown as string,
          width: 160,
          margin: [0, 0, 10, 0],
        };
        charts.push(chartImage);
      }
    }

    // Bloques
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
        const chartImage: PdfContent = {
          image: buffer as unknown as string,
          width: 160,
          margin: [0, 0, 10, 0],
        };
        charts.push(chartImage);
      }
    }

    // Ambientes
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
        const chartImage: PdfContent = {
          image: buffer as unknown as string,
          width: 160,
          margin: [0, 0, 10, 0],
        };
        charts.push(chartImage);
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

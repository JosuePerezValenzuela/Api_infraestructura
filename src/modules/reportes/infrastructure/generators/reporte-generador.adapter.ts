import { Injectable } from '@nestjs/common';
import Excel from 'exceljs';
import { PassThrough } from 'stream';
import PdfPrinter from 'pdfmake';
import vfsFonts from 'pdfmake/build/vfs_fonts';
import type {
  Content,
  StyleDictionary,
  TDocumentDefinitions,
} from 'pdfmake/interfaces';
import {
  ArchivoReporte,
  ReporteGeneradorPort,
} from '../../domain/ports/reporte-generador.port';
import {
  AmbienteView,
  BloqueView,
  CampusView,
  FacultadView,
  InventarioReporteViewModel,
  KpiResumen,
} from '../../domain/models/inventario.view-model';

const MIME_XLSX =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const MIME_PDF = 'application/pdf';

type SheetRow = Record<string, string | number | undefined>;

const PRIMARY = '#003049';
const LIGHT_BG = '#f7f9fb';

@Injectable()
export class ReporteGeneradorAdapter implements ReporteGeneradorPort {
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

  async generar_pdf(
    view_model: InventarioReporteViewModel,
  ): Promise<ArchivoReporte> {
    const docDefinition = this.buildPdfDefinition(view_model);
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
      { header: 'Valor', key: 'valor', width: 50 },
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
      { header: 'Valor', key: 'valor', width: 50 },
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
      { header: 'Valor', key: 'valor', width: 50 },
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
        valor: 'Nombre / Piso / Tipo / Capacidad / Estado / #Activos',
      })
      .commit();
    ambientes.forEach((a) => {
      const valor = `${a.nombre} / ${a.piso} / ${a.tipo_ambiente} / ${a.capacidad.total}/${a.capacidad.examen} / ${a.estado} / ${a.activos_count}`;
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
  private buildPdfDefinition(
    view: InventarioReporteViewModel,
  ): TDocumentDefinitions {
    const content: Content[] = [];

    if (view.campus) {
      content.push(...this.sectionCampus(view.campus));
      view.campus.facultades.forEach((fac, idx) => {
        if (idx > 0) {
          content.push({ text: '', pageBreak: 'before' });
        }
        content.push(...this.sectionFacultad(fac, false));
      });
    } else if (view.facultad) {
      content.push(...this.sectionFacultad(view.facultad, true));
    } else if (view.bloque) {
      content.push(...this.sectionBloque(view.bloque, true));
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

  private sectionCampus(campus: CampusView): Content[] {
    const blocks: Content[] = [];
    blocks.push({ text: `Campus: ${campus.nombre}`, style: 'header' });
    blocks.push(...this.kpiTable(campus.kpis));
    blocks.push(
      this.simpleTable(
        'Facultades',
        campus.facultades.map<Content[]>((f) => [
          f.codigo,
          f.nombre,
          f.estado,
          f.kpis.total_bloques ?? 0,
          f.kpis.total_ambientes ?? 0,
        ]),
        ['Código', 'Nombre', 'Estado', '#Bloques', '#Ambientes'],
      ),
    );
    return blocks;
  }

  private sectionFacultad(fac: FacultadView, pageBreak: boolean): Content[] {
    const blocks: Content[] = [];
    blocks.push({
      text: `Facultad: ${fac.nombre}`,
      style: 'header',
      pageBreak: pageBreak ? 'before' : undefined,
    });
    blocks.push(...this.kpiTable(fac.kpis));
    blocks.push(
      this.simpleTable(
        'Bloques',
        fac.bloques.map<Content[]>((b) => [
          b.codigo,
          b.nombre,
          b.tipo_bloque,
          b.estado,
          b.kpis.total_ambientes ?? 0,
          b.kpis.capacidad?.total ?? 0,
          b.kpis.activos_asociados ?? 0,
        ]),
        [
          'Código',
          'Nombre',
          'Tipo',
          'Estado',
          '#Ambientes',
          'Cap. Total',
          '#Activos',
        ],
      ),
    );
    fac.bloques.forEach((b) => {
      blocks.push(...this.sectionBloque(b, false));
    });
    return blocks;
  }

  private sectionBloque(bloque: BloqueView, pageBreak: boolean): Content[] {
    const blocks: Content[] = [];
    blocks.push({
      text: `Bloque: ${bloque.nombre}`,
      style: 'subheader',
      pageBreak: pageBreak ? 'before' : undefined,
    });
    blocks.push(...this.kpiTable(bloque.kpis, true));
    blocks.push(
      this.simpleTable(
        'Ambientes',
        bloque.ambientes.map<Content[]>((a) => [
          a.codigo,
          a.nombre,
          a.piso,
          a.tipo_ambiente,
          `${a.capacidad.total}/${a.capacidad.examen}`,
          a.estado,
          a.activos_count,
        ]),
        [
          'Código',
          'Nombre',
          'Piso',
          'Tipo',
          'Capacidad T/Ex',
          'Estado',
          '#Activos',
        ],
      ),
    );
    return blocks;
  }

  private kpiTable(kpis: KpiResumen, compact = false): Content[] {
    const data: (string | number)[][] = [];
    if (kpis.total_facultades !== undefined) {
      data.push(['Total facultades', kpis.total_facultades]);
      data.push(['Facultades activas', kpis.facultades_activas ?? 0]);
      data.push(['Facultades inactivas', kpis.facultades_inactivas ?? 0]);
    }
    if (kpis.total_bloques !== undefined) {
      data.push(['Total bloques', kpis.total_bloques]);
      data.push(['Bloques activos', kpis.bloques_activos ?? 0]);
      data.push(['Bloques inactivos', kpis.bloques_inactivos ?? 0]);
    }
    if (kpis.total_ambientes !== undefined) {
      data.push(['Total ambientes', kpis.total_ambientes]);
      data.push(['Ambientes activos', kpis.ambientes_activos ?? 0]);
      data.push(['Ambientes inactivos', kpis.ambientes_inactivos ?? 0]);
    }
    if (kpis.capacidad) {
      data.push(['Capacidad total (asientos)', kpis.capacidad.total]);
      data.push(['Capacidad examen (asientos)', kpis.capacidad.examen]);
    }
    if (kpis.activos_asociados !== undefined) {
      data.push(['Activos asociados', kpis.activos_asociados]);
    }
    if (!data.length) {
      return [];
    }
    const widths = compact ? ['*', '*'] : ['auto', '*'];
    return [
      {
        table: {
          widths,
          body: [['Indicador', 'Valor'], ...data],
        },
        layout: 'lightHorizontalLines',
        style: 'kpiLabel',
      },
    ];
  }

  private simpleTable(
    _title: string,
    rows: (string | number)[][],
    headers: string[],
  ): Content {
    return {
      margin: [0, 6, 0, 6],
      table: {
        headerRows: 1,
        widths: Array(headers.length).fill('auto'),
        body: [headers, ...rows],
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
    const fonts = (
      vfsFonts as unknown as { pdfMake: { vfs: Record<string, string> } }
    ).pdfMake.vfs;
    const printer = new PdfPrinter({
      Roboto: {
        normal: Buffer.from(fonts['Roboto-Regular.ttf'], 'base64'),
        bold: Buffer.from(fonts['Roboto-Medium.ttf'], 'base64'),
        italics: Buffer.from(fonts['Roboto-Italic.ttf'], 'base64'),
        bolditalics: Buffer.from(fonts['Roboto-MediumItalic.ttf'], 'base64'),
      },
    });

    return await new Promise<PassThrough>((resolve, reject) => {
      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      const stream = new PassThrough();
      pdfDoc.on('error', reject);
      stream.on('error', reject);
      stream.on('finish', () => resolve(stream));
      pdfDoc.pipe(stream);
      pdfDoc.end();
    });
  }
}

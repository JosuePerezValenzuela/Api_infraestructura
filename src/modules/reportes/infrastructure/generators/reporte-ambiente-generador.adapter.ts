import { Injectable } from '@nestjs/common';
import Excel from 'exceljs';
import { PassThrough } from 'stream';
import PdfPrinter from 'pdfmake';
import type { TDocumentDefinitions, TableCell } from 'pdfmake/interfaces';
import type { ReporteAmbienteGeneradorPort } from '../../domain/ports/ambiente-reporte-generador.port';
import type { AmbienteDetalleViewModel } from '../../domain/ports/ambiente-reporte.repository';
import type { ArchivoReporte } from '../../domain/ports/reporte-generador.port';

const MIME_XLSX =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const MIME_PDF = 'application/pdf';

// Paleta simple para darle un aspecto más cuidado al PDF.
const PRIMARY = '#003049';
const LIGHT_BG = '#f4f6fb';
const ACCENT = '#d1e7ff';

@Injectable()
export class ReporteAmbienteGeneradorAdapter implements ReporteAmbienteGeneradorPort {
  // Genera un PDF a partir del view-model del ambiente.
  async generar_pdf(
    view_model: AmbienteDetalleViewModel,
  ): Promise<ArchivoReporte> {
    // Definimos el documento PDF con encabezado, fichas y tablas.
    const docDefinition: TDocumentDefinitions =
      this.buildPdfDefinition(view_model);
    // Creamos el stream PDF usando pdfmake (Helvetica, sin fuentes externas).
    const stream = await this.createPdfStream(docDefinition);
    // Construimos el nombre de archivo segun el codigo del ambiente y la fecha actual.
    const filename = this.buildFilename(view_model.ambiente.codigo, 'pdf');
    // Devolvemos el archivo listo para ser enviado al cliente.
    return { stream, filename, mime_type: MIME_PDF };
  }

  // Genera un Excel a partir del view-model del ambiente.
  async generar_excel(
    view_model: AmbienteDetalleViewModel,
  ): Promise<ArchivoReporte> {
    // Creamos un stream en memoria donde ExcelJS escribira el archivo.
    const stream = new PassThrough();
    // Instanciamos un workbook en modo streaming para no consumir memoria en exceso.
    const workbook = new Excel.stream.xlsx.WorkbookWriter({
      stream,
      useStyles: true,
      useSharedStrings: true,
    });

    // Renderizamos una unica hoja con encabezado, ficha, matriz de horarios y activos.
    const sheet = workbook.addWorksheet('Ambiente');
    this.renderExcelSheet(sheet, view_model);
    // Cerramos el workbook para que se escriba el contenido al stream.
    await workbook.commit();

    // Armamos el nombre final del archivo.
    const filename = this.buildFilename(view_model.ambiente.codigo, 'xlsx');
    return { stream, filename, mime_type: MIME_XLSX };
  }

  // -------------------- Helpers PDF --------------------

  // Construye la definicion del documento PDF con las secciones solicitadas.
  private buildPdfDefinition(
    view: AmbienteDetalleViewModel,
  ): TDocumentDefinitions {
    const generatedAt = new Date();
    const availabilityTable = this.buildPdfAvailabilityTable(
      view.disponibilidadMatriz,
    );
    const activosTable = this.buildPdfActivosTable(view.activos);

    return {
      info: {
        title: `Reporte del ambiente ${view.ambiente.nombre}`,
        subject: 'Detalle de ambiente con horarios y activos',
      },
      pageMargins: [40, 60, 40, 40],
      defaultStyle: {
        font: 'Helvetica',
        fontSize: 10,
        color: '#1f2933',
      },
      content: [
        {
          text: `Reporte del ambiente: ${view.ambiente.nombre} (${view.ambiente.codigo})`,
          style: 'title',
          margin: [0, 0, 0, 6],
        },
        {
          text: `Generado: ${generatedAt.toISOString()}`,
          margin: [0, 4, 0, 12],
          style: 'caption',
        },
        { text: 'Ficha resumen', style: 'h2', margin: [0, 8, 0, 6] },
        this.buildPdfFichaTable(view),
        { text: 'Disponibilidad horaria', style: 'h2', margin: [0, 12, 0, 6] },
        availabilityTable,
        { text: 'Activos', style: 'h2', margin: [0, 12, 0, 6] },
        activosTable,
      ],
      styles: {
        title: { fontSize: 16, bold: true, color: PRIMARY },
        h2: { fontSize: 12, bold: true, color: PRIMARY },
        caption: { fontSize: 9, color: '#555' },
        tableHeader: { bold: true, fillColor: LIGHT_BG },
        cellCentered: { alignment: 'center' },
        chip: {
          color: '#0f5132',
          fillColor: '#d1e7dd',
          bold: true,
          alignment: 'center',
        },
      },
    };
  }

  // Crea el stream PDF a partir de la definicion usando solo fuentes estándar (Helvetica).
  private async createPdfStream(
    def: TDocumentDefinitions,
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
      const pdfDoc = printer.createPdfKitDocument(def);
      const stream = new PassThrough();

      pdfDoc.on('error', (err) => {
        console.error('[PDF Ambiente] Error en pdfDoc:', err);
        const error =
          err instanceof Error ? err : new Error(String(err ?? 'Error PDF'));
        stream.destroy(error);
      });

      stream.on('error', (err) => {
        console.error('[PDF Ambiente] Error en stream:', err);
      });

      pdfDoc.pipe(stream);
      pdfDoc.end();

      resolve(stream);
    });
  }

  // Construye la tabla de ficha resumen para el PDF.
  private buildPdfFichaTable(view: AmbienteDetalleViewModel) {
    const rows = [
      ['Campus', view.campus.nombre],
      ['Facultad', `${view.facultad.nombre} (${view.facultad.codigo})`],
      ['Bloque', `${view.bloque.nombre} (${view.bloque.codigo})`],
      ['Tipo de bloque', view.bloque.tipo_bloque.nombre],
      ['Tipo de ambiente', view.tipo_ambiente.nombre],
      ['Estado', view.ambiente.activo ? 'Activo' : 'Inactivo'],
      [
        'Capacidad',
        `Total: ${view.ambiente.capacidad.total} | Examen: ${view.ambiente.capacidad.examen}`,
      ],
      [
        'Dimensiones',
        `${view.ambiente.dimension.largo} x ${view.ambiente.dimension.ancho} x ${view.ambiente.dimension.alto} ${view.ambiente.dimension.unid_med}`,
      ],
      ['Piso', view.ambiente.piso],
      ['Clases', view.ambiente.clases ? 'Si' : 'No'],
      [
        'Horario operacion',
        view.horarios.length > 0
          ? `${view.horarios[0].hora_inicio} - ${view.horarios[0].hora_fin}`
          : 'Sin horario',
      ],
    ];

    return {
      table: {
        widths: [140, '*'],
        body: rows.map((r) => [
          { text: r[0], style: 'tableHeader' },
          { text: String(r[1]) },
        ]),
      },
      layout: 'lightHorizontalLines',
    };
  }

  // Construye la tabla de disponibilidad horaria en formato matriz.
  private buildPdfAvailabilityTable(
    matriz: AmbienteDetalleViewModel['disponibilidadMatriz'],
  ) {
    const header: TableCell[] = [
      { text: 'Horas', style: 'tableHeader', alignment: 'center' },
      { text: 'Lunes', style: 'tableHeader', alignment: 'center' },
      { text: 'Martes', style: 'tableHeader', alignment: 'center' },
      { text: 'Miercoles', style: 'tableHeader', alignment: 'center' },
      { text: 'Jueves', style: 'tableHeader', alignment: 'center' },
      { text: 'Viernes', style: 'tableHeader', alignment: 'center' },
      { text: 'Sabado', style: 'tableHeader', alignment: 'center' },
      { text: 'Domingo', style: 'tableHeader', alignment: 'center' },
    ];

    const body: TableCell[][] = matriz.map((fila) => [
      { text: fila.hora, style: 'cellCentered' } as TableCell,
      { text: ' ', fillColor: fila.lunes ? ACCENT : undefined } as TableCell,
      { text: ' ', fillColor: fila.martes ? ACCENT : undefined } as TableCell,
      {
        text: ' ',
        fillColor: fila.miercoles ? ACCENT : undefined,
      } as TableCell,
      { text: ' ', fillColor: fila.jueves ? ACCENT : undefined } as TableCell,
      { text: ' ', fillColor: fila.viernes ? ACCENT : undefined } as TableCell,
      { text: ' ', fillColor: fila.sabado ? ACCENT : undefined } as TableCell,
      { text: ' ', fillColor: fila.domingo ? ACCENT : undefined } as TableCell,
    ]);

    return {
      table: {
        widths: [50, 50, 50, 60, 50, 50, 50, 60],
        body: [header, ...body],
      },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => '#d7dde5',
        vLineColor: () => '#d7dde5',
        paddingTop: () => 4,
        paddingBottom: () => 4,
      },
    };
  }

  // Construye la tabla de activos o un mensaje cuando no hay registros.
  private buildPdfActivosTable(activos: AmbienteDetalleViewModel['activos']) {
    if (activos.length === 0) {
      return { text: 'Sin activos asociados', italics: true };
    }

    const header = [
      { text: 'NIA', style: 'tableHeader' },
      { text: 'Nombre', style: 'tableHeader' },
      { text: 'Descripcion', style: 'tableHeader' },
    ];

    const body = activos.map((a) => [a.nia, a.nombre, a.descripcion ?? '']);

    return {
      table: {
        widths: [100, 200, '*'],
        body: [header, ...body],
      },
      layout: 'lightHorizontalLines',
    };
  }

  // -------------------- Helpers Excel --------------------

  // Rellena la hoja de Excel con las secciones requeridas.
  private renderExcelSheet(
    sheet: Excel.Worksheet,
    view: AmbienteDetalleViewModel,
  ) {
    // Titulo y fecha de generacion.
    sheet.addRow([
      `Reporte del ambiente: ${view.ambiente.nombre} (${view.ambiente.codigo})`,
    ]).font = { bold: true, size: 14, color: { argb: 'FF003049' } };
    sheet.addRow([`Generado: ${new Date().toISOString()}`]).font = {
      size: 10,
      color: { argb: 'FF555555' },
    };
    sheet.addRow([]);

    // Ficha resumen.
    sheet.addRow(['Ficha resumen']).font = { bold: true };
    const fichaRows = [
      ['Campus', view.campus.nombre],
      ['Facultad', `${view.facultad.nombre} (${view.facultad.codigo})`],
      ['Bloque', `${view.bloque.nombre} (${view.bloque.codigo})`],
      ['Tipo de bloque', view.bloque.tipo_bloque.nombre],
      ['Tipo de ambiente', view.tipo_ambiente.nombre],
      ['Estado', view.ambiente.activo ? 'Activo' : 'Inactivo'],
      [
        'Capacidad',
        `Total: ${view.ambiente.capacidad.total} | Examen: ${view.ambiente.capacidad.examen}`,
      ],
      [
        'Dimensiones',
        `${view.ambiente.dimension.largo} x ${view.ambiente.dimension.ancho} x ${view.ambiente.dimension.alto} ${view.ambiente.dimension.unid_med}`,
      ],
      ['Piso', view.ambiente.piso],
      ['Clases', view.ambiente.clases ? 'Si' : 'No'],
      [
        'Horario operacion',
        view.horarios.length > 0
          ? `${view.horarios[0].hora_inicio} - ${view.horarios[0].hora_fin}`
          : 'Sin horario',
      ],
    ];
    fichaRows.forEach((r) => {
      const row = sheet.addRow(r);
      row.getCell(1).font = { bold: true };
    });

    sheet.addRow([]);
    sheet.addRow(['Disponibilidad horaria (matriz)']).font = { bold: true };

    // Tabla de disponibilidad.
    const header = [
      'Horas',
      'Lunes',
      'Martes',
      'Miercoles',
      'Jueves',
      'Viernes',
      'Sabado',
      'Domingo',
    ];
    const headerRow = sheet.addRow(header);
    headerRow.font = { bold: true };
    view.disponibilidadMatriz.forEach((fila) => {
      sheet.addRow([
        fila.hora,
        fila.lunes ? 'X' : '',
        fila.martes ? 'X' : '',
        fila.miercoles ? 'X' : '',
        fila.jueves ? 'X' : '',
        fila.viernes ? 'X' : '',
        fila.sabado ? 'X' : '',
        fila.domingo ? 'X' : '',
      ]);
    });

    sheet.addRow([]);
    sheet.addRow(['Activos']).font = { bold: true };

    if (view.activos.length === 0) {
      sheet.addRow(['Sin activos asociados']);
      return;
    }

    const activosHeader = ['NIA', 'Nombre', 'Descripcion'];
    const activosHeaderRow = sheet.addRow(activosHeader);
    activosHeaderRow.font = { bold: true };
    view.activos.forEach((a) => {
      sheet.addRow([a.nia, a.nombre, a.descripcion ?? '']);
    });
  }

  // Construye el nombre de archivo con timestamp compacto.
  private buildFilename(codigo: string, ext: 'pdf' | 'xlsx'): string {
    const now = new Date();
    const stamp = `${now.getFullYear()}${(now.getMonth() + 1)
      .toString()
      .padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}${now
      .getHours()
      .toString()
      .padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
    return `ambiente-${codigo}-${stamp}.${ext}`;
  }
}

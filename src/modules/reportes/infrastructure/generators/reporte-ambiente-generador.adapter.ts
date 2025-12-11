import { Injectable } from '@nestjs/common';
import Excel from 'exceljs';
import { PassThrough } from 'stream';
import PdfPrinter from 'pdfmake';
import * as path from 'path';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';
import type { ReporteAmbienteGeneradorPort } from '../../domain/ports/ambiente-reporte-generador.port';
import type { AmbienteDetalleViewModel } from '../../domain/ports/ambiente-reporte.repository';
import type { ArchivoReporte } from '../../domain/ports/reporte-generador.port';

const MIME_XLSX =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const MIME_PDF = 'application/pdf';

@Injectable()
export class ReporteAmbienteGeneradorAdapter implements ReporteAmbienteGeneradorPort {
  // Genera un PDF a partir del view-model del ambiente.
  async generar_pdf(
    view_model: AmbienteDetalleViewModel,
  ): Promise<ArchivoReporte> {
    // Definimos el documento PDF con encabezado, fichas y tablas.
    const docDefinition: TDocumentDefinitions =
      this.buildPdfDefinition(view_model);
    // Creamos el stream PDF usando pdfmake con las fuentes Roboto incluidas en el proyecto.
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
      content: [
        {
          text: `Reporte del ambiente: ${view.ambiente.nombre} (${view.ambiente.codigo})`,
          style: 'title',
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
        title: { fontSize: 16, bold: true, color: '#003049' },
        h2: { fontSize: 12, bold: true, color: '#003049' },
        caption: { fontSize: 9, color: '#555' },
        tableHeader: { bold: true, fillColor: '#f0f4f8' },
        cellCentered: { alignment: 'center' },
      },
    };
  }

  // Crea el stream PDF a partir de la definicion usando las fuentes Roboto.
  private createPdfStream(def: TDocumentDefinitions): Promise<PassThrough> {
    return new Promise((resolve, reject) => {
      // Definimos las rutas de las fuentes Roboto disponibles en src/assets/fonts.
      const fontsPath = path.join(process.cwd(), 'src', 'assets', 'fonts');
      const printer = new PdfPrinter({
        Roboto: {
          normal: path.join(fontsPath, 'Roboto-Regular.ttf'),
          bold: path.join(fontsPath, 'Roboto-Medium.ttf'),
          italics: path.join(fontsPath, 'Roboto-Italic.ttf'),
          bolditalics: path.join(fontsPath, 'Roboto-MediumItalic.ttf'),
        },
      });

      // Creamos el documento PDF y acumulamos los fragmentos en memoria.
      const pdfDoc = printer.createPdfKitDocument(def);
      const chunks: Buffer[] = [];
      pdfDoc.on('data', (chunk) => chunks.push(chunk as Buffer));
      pdfDoc.on('end', () => {
        // Cuando termina, empaquetamos los fragmentos en un stream legible.
        const stream = new PassThrough();
        stream.end(Buffer.concat(chunks));
        resolve(stream);
      });
      pdfDoc.on('error', reject);
      pdfDoc.end();
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
        'Horario base',
        `${view.ambiente.hora_apertura ?? '-'} - ${view.ambiente.hora_cierre ?? '-'}`,
      ],
      ['Periodo (min)', view.ambiente.periodo ?? '-'],
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
    const header = [
      { text: 'Horas', style: 'tableHeader' },
      { text: 'Lunes', style: 'tableHeader' },
      { text: 'Martes', style: 'tableHeader' },
      { text: 'Miercoles', style: 'tableHeader' },
      { text: 'Jueves', style: 'tableHeader' },
      { text: 'Viernes', style: 'tableHeader' },
      { text: 'Sabado', style: 'tableHeader' },
      { text: 'Domingo', style: 'tableHeader' },
    ];

    const body = matriz.map((fila) => [
      { text: fila.hora, style: 'cellCentered' },
      { text: fila.lunes ? 'X' : '', style: 'cellCentered' },
      { text: fila.martes ? 'X' : '', style: 'cellCentered' },
      { text: fila.miercoles ? 'X' : '', style: 'cellCentered' },
      { text: fila.jueves ? 'X' : '', style: 'cellCentered' },
      { text: fila.viernes ? 'X' : '', style: 'cellCentered' },
      { text: fila.sabado ? 'X' : '', style: 'cellCentered' },
      { text: fila.domingo ? 'X' : '', style: 'cellCentered' },
    ]);

    return {
      table: {
        widths: [50, 50, 50, 60, 50, 50, 50, 60],
        body: [header, ...body],
      },
      layout: 'lightHorizontalLines',
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
        'Horario base',
        `${view.ambiente.hora_apertura ?? '-'} - ${view.ambiente.hora_cierre ?? '-'}`,
      ],
      ['Periodo (min)', view.ambiente.periodo ?? '-'],
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

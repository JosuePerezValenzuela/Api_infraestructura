/* eslint-disable indent */
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AmbientesDisponiblesRepositoryPort } from '../../domain/ambiente.disponibles.port';
import {
  AmbienteDisponibleItem,
  ListAmbientesDisponiblesQuery,
  ListAmbientesDisponiblesResult,
} from '../../domain/ambiente.disponibles.types';

@Injectable()
export class TypeormAmbientesDisponiblesRepository
  implements AmbientesDisponiblesRepositoryPort
{
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  // Esta funcion arma la consulta SQL, ejecuta el query y agrupa los ambientes.
  async listDisponibles(
    query: ListAmbientesDisponiblesQuery,
  ): Promise<ListAmbientesDisponiblesResult> {
    // Definimos la pagina actual o usamos 1 si no viene nada.
    const page = query.page ?? 1;
    // Definimos la cantidad de grupos por pagina o usamos 10 por defecto.
    const take = query.take ?? 10;
    // Guardamos todos los valores que iran en el SQL parametrizado.
    const params: Array<number | string | boolean | number[]> = [];
    // Cada condicion del WHERE se va acumulando aqui.
    const conditions: string[] = [];
    // Siempre filtramos ambientes activos para no mostrar registros deshabilitados.
    conditions.push('a.activo = TRUE');

    // Filtro por capacidad total minima cuando se envia el valor.
    if (query.capacidad_min !== undefined) {
      // Agregamos el parametro a la lista para que se asigne un indice.
      params.push(query.capacidad_min);
      // Construimos la condicion usando el indice recien agregado.
      conditions.push(`(a.capacidad->>'total')::int >= $${params.length}`);
    }

    // Filtro por capacidad de examen cuando no se requiere agrupar por piso.
    if (query.capacidad_examen_min !== undefined && !query.mismo_piso) {
      // Guardamos el valor minimo de examen como parametro.
      params.push(query.capacidad_examen_min);
      // Aplicamos el filtro directamente sobre cada ambiente.
      conditions.push(`(a.capacidad->>'examen')::int >= $${params.length}`);
    }

    // Filtro por tipos de ambiente cuando llega el arreglo.
    if (query.tipo_ambiente_ids && query.tipo_ambiente_ids.length > 0) {
      // Anadimos el arreglo completo como parametro tipo ANY de Postgres.
      params.push(query.tipo_ambiente_ids);
      // Creamos la condicion usando el indice actual.
      conditions.push(`a.tipo_ambiente_id = ANY($${params.length})`);
    }

    // Filtro por campus usando los ids enviados.
    if (query.campus_ids && query.campus_ids.length > 0) {
      params.push(query.campus_ids);
      conditions.push(`f.campus_id = ANY($${params.length})`);
    }

    // Filtro por facultad cuando se indican ids.
    if (query.facultad_ids && query.facultad_ids.length > 0) {
      params.push(query.facultad_ids);
      conditions.push(`f.id = ANY($${params.length})`);
    }

    // Filtro por bloque especifico si se envian ids.
    if (query.bloque_ids && query.bloque_ids.length > 0) {
      params.push(query.bloque_ids);
      conditions.push(`b.id = ANY($${params.length})`);
    }

    // Filtro por tipo de bloque usando arreglo de ids.
    if (query.tipo_bloque_ids && query.tipo_bloque_ids.length > 0) {
      params.push(query.tipo_bloque_ids);
      conditions.push(`b.tipo_bloque_id = ANY($${params.length})`);
    }

    // Filtro por disponibilidad en horario especifico.
    if (query.horario) {
      // Guardamos el dia solicitado como parametro.
      params.push(query.horario.dia);
      // Guardamos la hora de inicio del rango buscado.
      params.push(query.horario.hora_inicio);
      // Guardamos la hora final del rango buscado.
      params.push(query.horario.hora_fin);
      // Agregamos una condicion EXISTS que valida que no haya solapamiento en el horario.
      conditions.push(
        `EXISTS (SELECT 1 FROM infraestructura.horarios h WHERE h.ambiente_id = a.id AND h.dia = $${params.length - 2} AND h.hora_inicio <= $${params.length - 1} AND h.hora_fin >= $${params.length})`,
      );
    }

    // Unimos las condiciones con AND si hay alguna, de lo contrario no agregamos WHERE.
    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    // Determinamos la columna de orden segun la solicitud; si no viene usamos codigo para consistencia.
    const orderColumn =
      query.orderBy && ['nombre', 'codigo', 'piso'].includes(query.orderBy)
        ? `a.${query.orderBy}`
        : 'a.codigo';
    // Ajustamos la direccion de orden a mayusculas para el SQL.
    const orderDirection = (query.orderDir ?? 'asc').toUpperCase();

    // Consulta principal que trae los ambientes junto a sus datos relacionados.
    const dataSql = `
      SELECT
        a.id,
        a.codigo,
        a.nombre,
        a.nombre_corto,
        a.piso,
        a.capacidad,
        a.clases,
        a.activo,
        a.tipo_ambiente_id,
        ta.nombre AS tipo_ambiente_nombre,
        b.id AS bloque_id,
        b.nombre AS bloque_nombre,
        b.tipo_bloque_id,
        tb.nombre AS tipo_bloque_nombre,
        f.id AS facultad_id,
        f.nombre AS facultad_nombre,
        f.campus_id,
        c.nombre AS campus_nombre
      FROM infraestructura.ambientes a
      JOIN infraestructura.bloques b ON b.id = a.bloque_id
      JOIN infraestructura.facultades f ON f.id = b.facultad_id
      JOIN infraestructura.tipo_bloques tb ON tb.id = b.tipo_bloque_id
      JOIN infraestructura.campus c ON c.id = f.campus_id
      JOIN infraestructura.tipo_ambientes ta ON ta.id = a.tipo_ambiente_id
      ${whereClause}
      ORDER BY ${orderColumn} ${orderDirection}
    `;

    // Ejecutamos la consulta usando los parametros ya armados.
    const rows = await this.dataSource.query<DisponiblesRow[]>(dataSql, params);
    // Agrupamos los ambientes por bloque y piso o como individuales segun mismo_piso.
    const grouped = this.groupRows(rows, query.mismo_piso ?? false);

    // Si se pidio capacidad de examen minima y se agrupa por piso, reducimos cada grupo al minimo de ambientes necesarios.
    const normalizedGroups =
      query.capacidad_examen_min !== undefined && (query.mismo_piso ?? false)
        ? grouped.map((group) =>
            this.pruneGroupByCapacidadExamen(
              group,
              query.capacidad_examen_min as number,
            ),
          )
        : grouped;

    // Filtramos grupos que cumplan la capacidad minima cuando aplique.
    const filteredGroups =
      query.capacidad_examen_min !== undefined && (query.mismo_piso ?? false)
        ? normalizedGroups.filter(
            (group) =>
              group.capacidad_examen_total >= query.capacidad_examen_min!,
          )
        : normalizedGroups;

    // Ordenamos los grupos segun la columna solicitada o por capacidad de examen total.
    const orderedGroups = this.sortGroups(
      filteredGroups,
      query.orderBy,
      query.orderDir,
    );
    // Calculamos el desplazamiento para la paginacion.
    const offset = (page - 1) * take;
    // Recortamos la lista segun page y take para entregar solo la pagina requerida.
    const paginatedItems = orderedGroups.slice(offset, offset + take);
    // Total de grupos luego de aplicar los filtros.
    const total = orderedGroups.length;
    // Determinamos si hay siguiente pagina.
    const hasNextPage = page * take < total;
    // Determinamos si hay pagina anterior.
    const hasPreviousPage = page > 1;

    // Retornamos la estructura con items y los metadatos de paginacion.
    return {
      items: paginatedItems,
      meta: {
        total,
        page,
        take,
        hasNextPage,
        hasPreviousPage,
      },
    };
  }

  // Esta funcion agrupa las filas crudas en estructura por bloque y piso.
  private groupRows(
    rows: DisponiblesRow[],
    mismoPiso: boolean,
  ): ListAmbientesDisponiblesResult['items'] {
    // Usamos un mapa para acumular los grupos y evitar recorridos extras.
    const groups = new Map<
      string,
      ListAmbientesDisponiblesResult['items'][0]
    >();

    // Recorremos cada fila devuelta por la base.
    for (const row of rows) {
      // Normalizamos la capacidad para trabajar con numeros.
      const capacidad = this.mapCapacidad(row.capacidad);
      // Creamos el item individual del ambiente.
      const ambiente: AmbienteDisponibleItem = {
        id: Number(row.id),
        codigo: row.codigo,
        nombre: row.nombre,
        nombre_corto: row.nombre_corto,
        piso: Number(row.piso),
        capacidad,
        clases: Boolean(row.clases),
        activo: Boolean(row.activo),
        tipo_ambiente_id: Number(row.tipo_ambiente_id),
        tipo_ambiente_nombre: row.tipo_ambiente_nombre,
      };

      // Definimos la clave de agrupacion: si mismoPiso es true, agrupamos por campus/facultad/bloque/tipo/piso.
      // Si mismoPiso es false, cada ambiente es su propio grupo para evitar combinaciones.
      const groupKey = mismoPiso
        ? `${row.campus_id}-${row.facultad_id}-${row.bloque_id}-${row.tipo_bloque_id}-${row.piso}`
        : `amb-${row.id}`;

      // Si no existe el grupo aun, lo creamos con la informacion base.
      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          campus_id: Number(row.campus_id),
          campus_nombre: row.campus_nombre,
          facultad_id: Number(row.facultad_id),
          facultad_nombre: row.facultad_nombre,
          bloque_id: Number(row.bloque_id),
          bloque_nombre: row.bloque_nombre,
          tipo_bloque_id: Number(row.tipo_bloque_id),
          tipo_bloque_nombre: row.tipo_bloque_nombre,
          piso: Number(row.piso),
          capacidad_examen_total: 0,
          capacidad_total: 0,
          ambientes: [],
        });
      }

      // Recuperamos el grupo para sumarle el ambiente actual.
      const group = groups.get(groupKey)!;
      // Sumamos las capacidades del ambiente al total del grupo.
      group.capacidad_examen_total += capacidad.examen;
      group.capacidad_total += capacidad.total;
      // Agregamos el ambiente al arreglo del grupo.
      group.ambientes.push(ambiente);
    }

    // Devolvemos la lista de grupos en un arreglo para facilitar el orden y paginacion.
    return Array.from(groups.values());
  }

  // Esta funcion ordena los grupos segun la configuracion enviada.
  private sortGroups(
    groups: ListAmbientesDisponiblesResult['items'],
    orderBy?: ListAmbientesDisponiblesQuery['orderBy'],
    orderDir?: ListAmbientesDisponiblesQuery['orderDir'],
  ): ListAmbientesDisponiblesResult['items'] {
    // Determinamos el factor de direccion (1 ascendente, -1 descendente).
    const direction = (orderDir ?? 'asc') === 'desc' ? -1 : 1;
    // Creamos una copia del arreglo para no mutar el original.
    const copy = [...groups];

    // Si no se especifica columna, ordenamos por capacidad de examen total.
    if (!orderBy) {
      copy.sort(
        (a, b) =>
          (a.capacidad_examen_total - b.capacidad_examen_total) * direction,
      );
      return copy;
    }

    // Orden personalizado cuando se indica columna.
    copy.sort((a, b) => {
      // Para piso comparamos el nivel directamente.
      if (orderBy === 'piso') {
        return (a.piso - b.piso) * direction;
      }

      if (orderBy === 'capacidad_examen_total') {
        return (
          (a.capacidad_examen_total - b.capacidad_examen_total) * direction
        );
      }

      if (orderBy === 'capacidad_total') {
        return (a.capacidad_total - b.capacidad_total) * direction;
      }

      // Para codigo o nombre comparamos el primer ambiente de cada grupo.
      const firstA = a.ambientes[0];
      const firstB = b.ambientes[0];
      const valueA = orderBy === 'codigo' ? firstA.codigo : firstA.nombre;
      const valueB = orderBy === 'codigo' ? firstB.codigo : firstB.nombre;
      return valueA.localeCompare(valueB) * direction;
    });

    // Retornamos el arreglo ya ordenado.
    return copy;
  }

  // Esta funcion asegura que la capacidad llegue como objeto y convierte cada campo a numero.
  private mapCapacidad(value: unknown): { total: number; examen: number } {
    // Transformamos valores que llegan como texto JSON a un objeto.
    const data = this.ensureJsonObject(value);
    // Extraemos el total asegurando un numero.
    const total = Number((data as Record<string, unknown>).total ?? 0);
    // Extraemos la capacidad de examen asegurando un numero.
    const examen = Number((data as Record<string, unknown>).examen ?? 0);
    // Devolvemos el objeto normalizado.
    return { total, examen };
  }

  // Esta funcion convierte cualquier entrada a un objeto simple para leer sus campos.
  private ensureJsonObject(value: unknown): Record<string, unknown> {
    // Si es cadena, intentamos parsear JSON.
    if (typeof value === 'string') {
      try {
        // Convertimos el texto a objeto.
        const parsed = JSON.parse(value) as unknown;
        // Validamos que el resultado sea objeto antes de retornarlo.
        if (parsed && typeof parsed === 'object') {
          return parsed as Record<string, unknown>;
        }
      } catch {
        // Si falla el parseo, devolvemos objeto vacio.
        return {};
      }
    }

    // Si ya es un objeto, lo devolvemos tal cual.
    if (value && typeof value === 'object') {
      return value as Record<string, unknown>;
    }

    // En cualquier otro caso, respondemos un objeto vacio para evitar errores.
    return {};
  }

  // Esta funcion selecciona la menor cantidad de ambientes cuyo total de examen alcanza la meta.
  private pruneGroupByCapacidadExamen(
    group: ListAmbientesDisponiblesResult['items'][0],
    minimo: number,
  ): ListAmbientesDisponiblesResult['items'][0] {
    // Ordenamos los ambientes del grupo por capacidad de examen descendente para cubrir el minimo con menos ambientes.
    const sorted = [...group.ambientes].sort(
      (a, b) => b.capacidad.examen - a.capacidad.examen,
    );

    const seleccionados: typeof group.ambientes = [];
    let acumulado = 0;

    for (const ambiente of sorted) {
      seleccionados.push(ambiente);
      acumulado += ambiente.capacidad.examen;
      if (acumulado >= minimo) {
        break;
      }
    }

    return {
      ...group,
      ambientes: seleccionados,
      capacidad_examen_total: acumulado,
      capacidad_total: seleccionados.reduce(
        (sum, amb) => sum + amb.capacidad.total,
        0,
      ),
    };
  }
}

// Definimos la forma que esperamos de cada fila devuelta por la base.
interface DisponiblesRow {
  id: number;
  codigo: string;
  nombre: string;
  nombre_corto: string | null;
  piso: number;
  capacidad: unknown;
  clases: boolean;
  activo: boolean;
  tipo_ambiente_id: number;
  tipo_ambiente_nombre: string;
  bloque_id: number;
  bloque_nombre: string;
  tipo_bloque_id: number;
  tipo_bloque_nombre: string;
  facultad_id: number;
  facultad_nombre: string;
  campus_id: number;
  campus_nombre: string;
}

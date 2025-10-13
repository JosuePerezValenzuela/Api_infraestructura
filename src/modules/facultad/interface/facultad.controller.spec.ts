// Este archivo define las pruebas del controlador de facultad para el endpoint GET paginado.
// Cada comentario explica con palabras sencillas que hace cada instruccion para que cualquier persona pueda seguirlo.
// Importamos la clase que vamos a probar; representa al controlador HTTP de la entidad facultad.
import { FacultadController } from './facultad.controller';
// Importamos los tipos que describen la respuesta paginada de facultades.
import type {
  ListFacultadesItem,
  ListFacultadesMeta,
  ListFacultadesResult,
} from '../domain/facultad.list.types';
// Importamos el DTO de consulta para simular las entradas que recibira la API.
import { ListFacultadesQueryDto } from './dto/list-facultades-query.dto';

// Definimos una interfaz de ayuda para describir el contrato del caso de uso de listado falso.
interface FakeListFacultadesUseCase {
  // Este metodo simula la ejecucion del caso de uso real y nos permite observar los parametros recibidos.
  execute: jest.Mock<
    Promise<ListFacultadesResult>,
    [Partial<ListFacultadesQueryDto>]
  >;
}

describe('FacultadController - findPaginated', () => {
  // Funcion auxiliar que construye el sistema de prueba con dependencias simuladas.
  const buildController = () => {
    // Preparamos un caso de uso de creacion falso porque el controlador lo espera en su constructor, aunque aqui no lo usemos.
    const createFacultadUseCase = { execute: jest.fn() };
    // Preparamos un caso de uso de listado falso usando jest para poder verificar las llamadas.
    const listFacultadesUseCase: FakeListFacultadesUseCase = {
      execute: jest.fn(),
    };
    // Instanciamos el controlador real pasando los casos de uso falsos.
    const controller = new FacultadController(
      createFacultadUseCase as any,
      listFacultadesUseCase as any,
    );
    // Retornamos todas las piezas para que cada prueba las utilice.
    return { controller, createFacultadUseCase, listFacultadesUseCase };
  };

  // Esta prueba representa la historia: "Como administrador quiero listar las facultades paginadas para revisar su informacion".
  it('retorna las facultades paginadas y transmite correctamente los filtros al caso de uso', async () => {
    // Construimos el controlador con sus dependencias simuladas.
    const { controller, listFacultadesUseCase } = buildController();
    // Definimos la respuesta que el caso de uso deberia entregar, con un item de ejemplo y metadatos.
    const responseItems: ListFacultadesItem[] = [
      {
        id: 7,
        codigo: 'FCYT-01',
        nombre: 'Facultad de Ciencias y Tecnologia',
        nombre_corto: 'FCyT',
        campus_nombre: 'Campus Central',
        activo: true,
        creado_en: '2025-10-10T15:30:00.000Z',
      },
    ];
    const responseMeta: ListFacultadesMeta = {
      total: 12,
      page: 2,
      take: 5,
      hasNextPage: true,
      hasPreviousPage: true,
    };
    const expectedResponse: ListFacultadesResult = {
      items: responseItems,
      meta: responseMeta,
    };
    // Configuramos el caso de uso falso para que resuelva con la respuesta esperada.
    listFacultadesUseCase.execute.mockResolvedValue(expectedResponse);
    // Creamos un DTO que simula los parametros de consulta enviados por el cliente HTTP.
    const queryDto = Object.assign(new ListFacultadesQueryDto(), {
      page: 2,
      limit: 5,
      search: 'tecnologia',
      orderBy: 'codigo' as const,
      orderDir: 'desc' as const,
    });
    // Ejecutamos el metodo GET del controlador pasando los parametros simulados.
    const result = await controller.findPaginated(queryDto);
    // Verificamos que el caso de uso recibio los filtros transformados al formato esperado por la capa de aplicacion.
    expect(listFacultadesUseCase.execute).toHaveBeenCalledWith({
      page: 2,
      take: 5,
      search: 'tecnologia',
      orderBy: 'codigo',
      orderDir: 'desc',
    });
    // Confirmamos que la respuesta entregada por el controlador coincide con lo devuelto por el caso de uso.
    expect(result).toEqual(expectedResponse);
  });

  // Esta prueba valida el comportamiento cuando el cliente no envia ciertos filtros opcionales.
  it('aplica valores opcionales en null cuando no se proporcionan y mantiene los defaults del DTO', async () => {
    // Construimos el controlador de prueba con dependencias falsas.
    const { controller, listFacultadesUseCase } = buildController();
    // Prepararmos una respuesta vacia para simplificar la verificacion.
    const emptyResponse: ListFacultadesResult = {
      items: [],
      meta: {
        total: 0,
        page: 1,
        take: 8,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
    // Configuramos el caso de uso para devolver la respuesta vacia.
    listFacultadesUseCase.execute.mockResolvedValue(emptyResponse);
    // Generamos un DTO sin search ni ordenamiento personalizado, usando solo el valor default de limit.
    const queryDto = Object.assign(new ListFacultadesQueryDto(), {});
    // Ejecutamos el metodo del controlador.
    await controller.findPaginated(queryDto);
    // Recuperamos la primera llamada realizada al caso de uso para inspeccionar los parametros.
    const [[params]] = listFacultadesUseCase.execute.mock.calls;
    // Confirmamos que el parametro search se envia como null para explicitar la ausencia de filtro.
    expect(params.search).toBeNull();
    // Verificamos que take utiliza el valor por defecto definido en el DTO, que es 8.
    expect(params.take).toBe(8);
    // Confirmamos que page tambien respeta el default igual a 1.
    expect(params.page).toBe(1);
  });
});

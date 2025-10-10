// Este archivo define las pruebas del caso de uso ListFacultadesUseCase y explica cada linea en lenguaje sencillo para aprender paso a paso.
// Importamos BadRequestException de NestJS para poder comprobar que el caso de uso rechaza parametros invalidos.
import { BadRequestException } from '@nestjs/common';
// Importamos el caso de uso (aun inexistente) para describir el comportamiento que deseamos construir.
import { ListFacultadesUseCase } from './list-facultades.usecase';
// Importamos solamente los tipos que usaremos para afirmar las llamadas del repositorio.
import type {
  ListFacultadesQuery,
  ListFacultadesResult,
} from '../domain/facultad.list.types';

// Definimos una interfaz de ayuda que describe las funciones que esperamos del repositorio de facultades.
interface FakeFacultadRepositoryPort {
  // Metodo simulado que debera devolver los resultados paginados de la consulta.
  findPaginated: jest.Mock<
    Promise<ListFacultadesResult>,
    [ListFacultadesQuery]
  >;
}

describe('ListFacultadesUseCase', () => {
  // Esta funcion fabrica el sistema bajo prueba creando el caso de uso con un repositorio falso controlable.
  const buildSystem = () => {
    // Creamos un repositorio falso con Jest para poder observar como es llamado.
    const facultadRepo: FakeFacultadRepositoryPort = {
      findPaginated: jest.fn(),
    };
    // Instanciamos el caso de uso pasando el repositorio falso para aislar la logica de negocio.
    const useCase = new ListFacultadesUseCase(facultadRepo as unknown as any);
    // Retornamos el caso de uso y el repositorio falso para que cada prueba pueda revisarlos.
    return { useCase, facultadRepo };
  };

  // Esta prueba cubre el escenario principal: listar facultades aplicando filtros, orden y paginacion personalizada.
  it('retorna las facultades paginadas y respeta los filtros solicitados', async () => {
    // Construimos el caso de uso junto a su repositorio falso.
    const { useCase, facultadRepo } = buildSystem();
    // Preparamos el resultado que el repositorio deberia responder con datos reales.
    const repoResponse: ListFacultadesResult = {
      items: [
        {
          codigo: 'FCYT-01',
          nombre: 'Facultad de Ciencias y Tecnologia',
          nombre_corto: 'FCyT',
          campus_nombre: 'Campus Central',
          activo: true,
          creado_en: '2025-09-24T15:20:30.767Z',
        },
      ],
      meta: {
        total: 15,
        page: 2,
        take: 8,
        hasNextPage: true,
        hasPreviousPage: true,
      },
    };
    // Configuramos el repositorio falso para que resuelva con el resultado preparado.
    facultadRepo.findPaginated.mockResolvedValue(repoResponse);
    // Definimos la consulta que representa la combinacion de filtros elegida por el administrador.
    const query = {
      page: 2,
      take: 8,
      search: 'tecnologia',
      orderBy: 'codigo' as const,
      orderDir: 'desc' as const,
    };
    // Ejecutamos el caso de uso con la consulta.
    const result = await useCase.execute(query);
    // Verificamos que el repositorio recibio exactamente la misma consulta, lo cual garantiza que los filtros llegaron completos.
    expect(facultadRepo.findPaginated).toHaveBeenCalledWith(query);
    // Confirmamos que el caso de uso devuelve el resultado que el repositorio reporto sin alterar la estructura.
    expect(result).toEqual(repoResponse);
  });

  // Esta prueba valida que los valores por defecto (pagina, cantidad y orden) se apliquen cuando el consumidor no los envia.
  it('usa valores por defecto cuando la consulta no indica paginacion u orden', async () => {
    // Construimos el sistema bajo prueba.
    const { useCase, facultadRepo } = buildSystem();
    // Indicamos que el repositorio respondio con una lista vacia para simplificar la comprobacion.
    facultadRepo.findPaginated.mockResolvedValue({
      items: [],
      meta: {
        total: 0,
        page: 1,
        take: 8,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });
    // Ejecutamos el caso de uso con una consulta vacia para verificar los defaults.
    await useCase.execute({});
    // Revisamos el primer llamado al repositorio y extraemos los argumentos utilizados.
    const [[querySent]] = facultadRepo.findPaginated.mock.calls;
    // Comprobamos que la pagina default es 1.
    expect(querySent.page).toBe(1);
    // Comprobamos que el numero de elementos por pagina es 8 por defecto.
    expect(querySent.take).toBe(8);
    // Confirmamos que el ordenamiento default usa el campo nombre.
    expect(querySent.orderBy).toBe('nombre');
    // Confirmamos que la direccion de ordenamiento por defecto es ascendente.
    expect(querySent.orderDir).toBe('asc');
  });

  // Esta prueba asegura que protegeremos la capa de dominio frente a ordenamientos no permitidos.
  it('lanza BadRequestException cuando se pide ordenar por un campo no soportado', async () => {
    // Armamos el sistema con el repositorio falso.
    const { useCase } = buildSystem();
    // Ejecutamos el caso de uso con un campo de ordenamiento invalido.
    await expect(
      useCase.execute({ orderBy: 'latitud' as 'nombre' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

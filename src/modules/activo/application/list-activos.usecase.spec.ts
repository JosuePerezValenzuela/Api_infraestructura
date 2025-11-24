// Esta suite documenta paso a paso como debe comportarse ListActivosUseCase.
// Cada linea tiene comentarios sencillos para que alguien sin experiencia pueda seguir la logica.

import { BadRequestException, Injectable } from '@nestjs/common';
import { ListActivosUseCase } from './list-activos.usecase';
import {
  ActivoListItem,
  ListActivosOptions,
  ListActivosResult,
} from '../domain/activo.list.types';
import { ActivoRepositoryPort } from '../domain/activo.repository.port';

// Definimos la forma del repositorio falso que usaremos en las pruebas.
// Con jest.mock podemos verificar que recibe los filtros correctos.
interface FakeActivoRepository {
  list: jest.Mock<Promise<ListActivosResult>, [ListActivosOptions]>;
}

// Marcamos el caso de uso como Injectable para imitar el comportamiento real de NestJS.
@Injectable()
class FakeListActivosUseCase extends ListActivosUseCase {}

// Datos de ejemplo que el repositorio falso devolvera cuando todo es valido.
const sampleItems: ActivoListItem[] = [
  {
    id: 1,
    nia: 'NIA-0001',
    nombre: 'Proyector Epson X12',
    descripcion: 'Proyector principal del auditorio central',
    creado_en: '2025-11-10T12:00:00.000Z',
    ambiente_id: 4,
    ambiente_nombre: 'Auditorio central',
    ambiente_codigo: 'AUD-001',
  },
];

// Resultado completo simulado con metadatos de paginacion.
const sampleResult: ListActivosResult = {
  items: sampleItems,
  meta: {
    total: 1,
    page: 1,
    take: 8,
    hasNextPage: false,
    hasPreviousPage: false,
  },
};

describe('ListActivosUseCase', () => {
  // Construimos el sistema bajo prueba armando el repositorio falso y el caso de uso.
  const buildSystem = () => {
    // jest.fn crea una funcion espia que devuelve sampleResult por defecto.
    const repo: FakeActivoRepository = {
      list: jest.fn().mockResolvedValue(sampleResult),
    };

    // Inyectamos el repo falso para no depender de la base de datos real.
    const useCase = new FakeListActivosUseCase(
      repo as unknown as ActivoRepositoryPort,
    );
    return { useCase, repo };
  };

  it('devuelve el listado cuando los filtros son validos', async () => {
    // Arrange: preparamos el sistema con el repo falso.
    const { useCase, repo } = buildSystem();
    // Act: ejecutamos el caso de uso con filtros completos.
    const result = await useCase.execute({
      page: 2,
      limit: 5,
      search: '  proyector ',
      orderBy: 'nia',
      orderDir: 'desc',
      ambienteId: 10,
    });
    // Assert: verificamos que el repo recibio los filtros normalizados.
    expect(repo.list).toHaveBeenCalledWith({
      page: 2,
      take: 5,
      search: 'proyector',
      orderBy: 'nia',
      orderDir: 'desc',
      ambienteId: 10,
    });
    // Tambien confirmamos que el resultado del repo se propaga sin cambios.
    expect(result).toEqual(sampleResult);
  });

  it('usa valores por defecto y normaliza search vacio', async () => {
    // Arrange: creamos el caso de uso con el repo falso.
    const { useCase, repo } = buildSystem();
    // Act: ejecutamos sin filtros (solo search vacio) para que aplique defaults.
    await useCase.execute({ search: '   ' });
    // Assert: espera page=1, take=8, search=null y orden por nombre asc.
    expect(repo.list).toHaveBeenCalledWith({
      page: 1,
      take: 8,
      search: null,
      orderBy: 'nombre',
      orderDir: 'asc',
      ambienteId: null,
    });
  });

  it('lanza BadRequestException cuando page es menor a 1', async () => {
    // Arrange: creamos el caso de uso.
    const { useCase } = buildSystem();
    // Act & Assert: al enviar page=0 debe rechazarse con BadRequestException.
    await expect(useCase.execute({ page: 0 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('lanza BadRequestException cuando limit esta fuera de 1..50', async () => {
    // Arrange: creamos el caso de uso.
    const { useCase } = buildSystem();
    // Act & Assert: limit=0 no es valido.
    await expect(useCase.execute({ limit: 0 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    // Act & Assert: limit=99 tampoco es valido por superar el maximo.
    await expect(useCase.execute({ limit: 99 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('lanza BadRequestException cuando orderBy no esta permitido', async () => {
    // Arrange: creamos el caso de uso.
    const { useCase } = buildSystem();
    // Act & Assert: orderBy invalido dispara la excepcion.
    await expect(
      useCase.execute({ orderBy: 'descripcion' as any }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lanza BadRequestException cuando orderDir no es asc o desc', async () => {
    // Arrange: creamos el caso de uso.
    const { useCase } = buildSystem();
    // Act & Assert: orderDir desconocido provoca error.
    await expect(
      useCase.execute({ orderDir: 'sideways' as any }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lanza BadRequestException cuando ambienteId no es entero positivo', async () => {
    // Arrange: creamos el caso de uso.
    const { useCase } = buildSystem();
    // Act & Assert: ambienteId=0 no cumple la regla y debe fallar.
    await expect(useCase.execute({ ambienteId: 0 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});

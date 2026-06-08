import { CacheKeyBuilder } from './cache-key-builder';

describe('CacheKeyBuilder', () => {
  describe('list', () => {
    it('builds key with sorted params in query-string format', () => {
      const key = CacheKeyBuilder.list('tipo_bloque', {
        page: 1,
        limit: 10,
        orderBy: 'nombre',
      });
      expect(key).toBe('tipo_bloque:list:limit=10&orderBy=nombre&page=1');
    });

    it('returns only the resource prefix when params are empty', () => {
      const key = CacheKeyBuilder.list('tipo_bloque', {});
      expect(key).toBe('tipo_bloque:list:');
    });

    it('excludes undefined and null values from params', () => {
      const key = CacheKeyBuilder.list('tipo_bloque', {
        page: 1,
        search: undefined,
        activo: null,
      });
      expect(key).toBe('tipo_bloque:list:page=1');
    });

    it('handles a single param correctly', () => {
      const key = CacheKeyBuilder.list('tipo_bloque', { id: 'abc-123' });
      expect(key).toBe('tipo_bloque:list:id=abc-123');
    });

    it('passes through string params with special characters', () => {
      const key = CacheKeyBuilder.list('tipo_bloque', {
        search: 'aula magna',
        filter: 'tipo:bloque',
      });
      expect(key).toBe('tipo_bloque:list:filter=tipo:bloque&search=aula magna');
    });
  });
});

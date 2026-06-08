import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service';

// ioredis mock factory
const createRedisMock = () => ({
  get: jest.fn(),
  setex: jest.fn(),
  del: jest.fn(),
  scan: jest.fn(),
  on: jest.fn(),
});

describe('CacheService', () => {
  let service: CacheService;
  let mockRedis: ReturnType<typeof createRedisMock>;

  beforeEach(() => {
    mockRedis = createRedisMock();

    // Mock Redis constructor used by CacheService
    // CacheService does `new Redis({...})` so we mock the entire Redis module
    jest.mock('ioredis', () => ({
      __esModule: true,
      default: jest.fn(() => mockRedis),
    }));

    // Re-import to pick up the mock
    // Instead, we'll inject mocked deps via a test-specific approach
    jest.restoreAllMocks(); // undo the jest.mock above to clean up

    // We'll use the actual class but pass mocked Redis through constructor replacement
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();

    const mockConfig = { get: jest.fn() };
    mockConfig.get.mockImplementation((key: string) => {
      if (key === 'REDIS_HOST') return 'redis';
      if (key === 'REDIS_PORT') return 6379;
      return undefined;
    });

    service = new CacheService(mockConfig as unknown as ConfigService);

    // Replace the internal redis client with our mock
    (service as any).redis = mockRedis;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getOrSet', () => {
    it('returns cached value when cache hits — factory NOT called', async () => {
      const cachedValue = { id: 1, name: 'Aula Magna' };
      mockRedis.get.mockResolvedValue(JSON.stringify(cachedValue));
      const factory = jest.fn();

      const result = await service.getOrSet('test:key', 300, factory);

      expect(result).toEqual(cachedValue);
      expect(factory).not.toHaveBeenCalled();
      expect(mockRedis.setex).not.toHaveBeenCalled();
    });

    it('calls factory and stores result on cache miss', async () => {
      const freshValue = { id: 2, name: 'Lab Computo' };
      mockRedis.get.mockResolvedValue(null);
      const factory = jest.fn().mockResolvedValue(freshValue);

      const result = await service.getOrSet('test:key', 300, factory);

      expect(result).toEqual(freshValue);
      expect(factory).toHaveBeenCalledTimes(1);
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'test:key',
        300,
        JSON.stringify(freshValue),
      );
    });

    it('fetches and recaches a fresh value after a later cache miss', async () => {
      const factory = jest
        .fn()
        .mockResolvedValueOnce({ id: 2, version: 1 })
        .mockResolvedValueOnce({ id: 2, version: 2 });

      mockRedis.get
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(JSON.stringify({ id: 2, version: 1 }))
        .mockResolvedValueOnce(null);

      await expect(
        service.getOrSet('bloque:list:page=1', 300, factory),
      ).resolves.toEqual({ id: 2, version: 1 });
      await expect(
        service.getOrSet('bloque:list:page=1', 300, factory),
      ).resolves.toEqual({ id: 2, version: 1 });
      await expect(
        service.getOrSet('bloque:list:page=1', 300, factory),
      ).resolves.toEqual({ id: 2, version: 2 });

      expect(factory).toHaveBeenCalledTimes(2);
      expect(mockRedis.setex).toHaveBeenNthCalledWith(
        1,
        'bloque:list:page=1',
        300,
        JSON.stringify({ id: 2, version: 1 }),
      );
      expect(mockRedis.setex).toHaveBeenNthCalledWith(
        2,
        'bloque:list:page=1',
        300,
        JSON.stringify({ id: 2, version: 2 }),
      );
    });

    it('propagates factory error — cache NOT modified', async () => {
      mockRedis.get.mockResolvedValue(null);
      const factoryError = new Error('DB connection failed');
      const factory = jest.fn().mockRejectedValue(factoryError);

      await expect(service.getOrSet('test:key', 300, factory)).rejects.toThrow(
        'DB connection failed',
      );
      expect(mockRedis.setex).not.toHaveBeenCalled();
    });

    it('still returns factory result when Redis setex throws', async () => {
      mockRedis.get.mockResolvedValue(null);
      const value = { id: 5, name: 'set-error' };
      const factory = jest.fn().mockResolvedValue(value);
      mockRedis.setex.mockRejectedValue(new Error('Redis write failed'));

      const result = await service.getOrSet('test:key', 300, factory);

      expect(result).toEqual(value);
      expect(Logger.prototype.error).toHaveBeenCalledWith(
        expect.stringContaining('Redis write failed'),
      );
    });

    it('falls back to factory when Redis get throws', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis timeout'));
      const fallbackValue = { id: 3, name: 'Biblioteca' };
      const factory = jest.fn().mockResolvedValue(fallbackValue);

      const result = await service.getOrSet('test:key', 300, factory);

      expect(result).toEqual(fallbackValue);
      expect(factory).toHaveBeenCalledTimes(1);
      expect(Logger.prototype.error).toHaveBeenCalledWith(
        expect.stringContaining('Redis timeout'),
      );
    });
  });

  describe('invalidate', () => {
    it('calls del with correct key', async () => {
      mockRedis.del.mockResolvedValue(1);

      await service.invalidate('test:key');

      expect(mockRedis.del).toHaveBeenCalledWith('test:key');
    });

    it('no-ops when Redis del throws', async () => {
      mockRedis.del.mockRejectedValue(new Error('Redis timeout'));

      await expect(service.invalidate('test:key')).resolves.toBeUndefined();

      expect(Logger.prototype.error).toHaveBeenCalledWith(
        expect.stringContaining('Redis timeout'),
      );
    });
  });

  describe('invalidateNamespace', () => {
    it('SCANs for pattern and DELs matching keys', async () => {
      mockRedis.scan.mockResolvedValue([
        '0',
        ['tipo_bloque:list:page=1', 'tipo_bloque:list:page=2'],
      ]);

      await service.invalidateNamespace('tipo_bloque:*');

      expect(mockRedis.scan).toHaveBeenCalledWith(
        '0',
        'MATCH',
        'tipo_bloque:*',
        'COUNT',
        100,
      );
      expect(mockRedis.del).toHaveBeenCalledWith(
        'tipo_bloque:list:page=1',
        'tipo_bloque:list:page=2',
      );
    });

    it('does not call DEL when SCAN returns no keys', async () => {
      mockRedis.scan.mockResolvedValue(['0', []]);

      await service.invalidateNamespace('tipo_bloque:*');

      expect(mockRedis.scan).toHaveBeenCalledTimes(1);
      expect(mockRedis.del).not.toHaveBeenCalled();
    });

    it('handles paginated SCAN results across multiple iterations', async () => {
      mockRedis.scan
        .mockResolvedValueOnce(['5', ['tipo_bloque:list:page=1']])
        .mockResolvedValueOnce(['0', ['tipo_bloque:list:page=2']]);

      await service.invalidateNamespace('tipo_bloque:*');

      expect(mockRedis.scan).toHaveBeenCalledTimes(2);
      expect(mockRedis.del).toHaveBeenCalledTimes(2);
      expect(mockRedis.del).toHaveBeenNthCalledWith(
        1,
        'tipo_bloque:list:page=1',
      );
      expect(mockRedis.del).toHaveBeenNthCalledWith(
        2,
        'tipo_bloque:list:page=2',
      );
    });

    it('no-ops when Redis scan throws — logs error', async () => {
      mockRedis.scan.mockRejectedValue(new Error('Redis timeout'));

      await expect(
        service.invalidateNamespace('bloque:*'),
      ).resolves.toBeUndefined();

      expect(Logger.prototype.error).toHaveBeenCalledWith(
        expect.stringContaining('Redis timeout'),
      );
    });
  });
});

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly redis: Redis;

  constructor(private readonly config: ConfigService) {
    this.redis = new Redis({
      host: this.config.get<string>('REDIS_HOST'),
      port: this.config.get<number>('REDIS_PORT'),
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
      lazyConnect: true,
    });

    this.redis.on('error', (err) => {
      this.logger.error(`Redis connection error: ${err.message}`);
    });
  }

  async getOrSet<T>(
    key: string,
    ttl: number,
    factory: () => Promise<T>,
  ): Promise<T> {
    try {
      const cached = await this.redis.get(key);
      if (cached !== null) {
        return JSON.parse(cached) as T;
      }
    } catch (err) {
      this.logger.error(
        `Cache get error for key "${key}": ${(err as Error).message}`,
      );
    }

    const value = await factory();

    try {
      await this.redis.setex(key, ttl, JSON.stringify(value));
    } catch (err) {
      this.logger.error(
        `Cache set error for key "${key}": ${(err as Error).message}`,
      );
    }

    return value;
  }

  async invalidate(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (err) {
      this.logger.error(
        `Cache del error for key "${key}": ${(err as Error).message}`,
      );
    }
  }

  async invalidateNamespace(pattern: string): Promise<void> {
    try {
      let cursor = '0';
      do {
        const [nextCursor, keys] = await this.redis.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          100,
        );
        cursor = nextCursor;
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } while (cursor !== '0');
    } catch (err) {
      this.logger.error(
        `Cache namespace invalidation error for pattern "${pattern}": ${(err as Error).message}`,
      );
    }
  }
}
